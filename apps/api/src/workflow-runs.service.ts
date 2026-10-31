import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class WorkflowRunsService {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string) {
    const r = await this.db.query('SELECT * FROM workflow_runs WHERE id=$1', [
      id,
    ]);
    if (!r.rowCount) throw new NotFoundException('Workflow run not found');
    return r.rows[0];
  }

  async findWf08ByOrganization(organizationId: string) {
    const [summary, enrichmentCounts, runs, enrichedLeads] = await Promise.all([
      this.db.query(
        `SELECT COUNT(*) AS total_runs,
                COUNT(*) FILTER (WHERE status = 'running') AS running,
                COUNT(*) FILTER (WHERE status = 'success') AS success,
                COUNT(*) FILTER (WHERE status = 'skipped') AS skipped,
                COUNT(*) FILTER (WHERE status = 'failed') AS failed,
                COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
                MAX(started_at) AS last_run_at
         FROM workflow_runs
         WHERE organization_id = $1 AND workflow_key = 'WF-08'`,
        [organizationId],
      ),
      this.db.query(
        `SELECT COUNT(*) FILTER (
                  WHERE metadata->'enrichment'->>'status' = 'enriched'
                ) AS enriched_leads,
                COUNT(*) FILTER (
                  WHERE metadata->'enrichment'->>'status' = 'partial'
                ) AS partial_leads,
                COUNT(*) FILTER (
                  WHERE metadata->'enrichment'->>'status' = 'not_found'
                ) AS not_found_leads
         FROM leads
         WHERE organization_id = $1
           AND metadata->'enrichment'->>'provider' = 'hunter'`,
        [organizationId],
      ),
      this.db.query(
        `SELECT r.id, r.status, r.input, r.output, r.error,
                r.started_at, r.finished_at,
                l.first_name, l.last_name, l.company_name, l.email,
                l.metadata->'enrichment' AS enrichment
         FROM workflow_runs r
         LEFT JOIN leads l
           ON l.id::text = r.output->>'leadId'
          AND l.organization_id = r.organization_id
         WHERE r.organization_id = $1 AND r.workflow_key = 'WF-08'
         ORDER BY r.started_at DESC
         LIMIT 20`,
        [organizationId],
      ),
      this.db.query(
        `SELECT id, first_name, last_name, company_name, email,
                metadata->'enrichment' AS enrichment, updated_at
         FROM leads
         WHERE organization_id = $1
           AND metadata->'enrichment'->>'provider' = 'hunter'
           AND metadata->'enrichment'->>'status' IN ('enriched', 'partial', 'not_found')
         ORDER BY updated_at DESC
         LIMIT 8`,
        [organizationId],
      ),
    ]);

    return {
      summary: { ...summary.rows[0], ...enrichmentCounts.rows[0] },
      runs: runs.rows,
      enrichedLeads: enrichedLeads.rows,
    };
  }
}
