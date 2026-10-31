import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from './database.service';

const DEFAULT_WF11_COMPETITORS = [
  'HubSpot',
  'Salesforce',
  'Zoho CRM',
  'Pipedrive',
  'GetFly CRM',
];

@Injectable()
export class WorkflowRunsService {
  private readonly logger = new Logger(WorkflowRunsService.name);

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

  async findWf11ByOrganization(organizationId: string) {
    let config;
    let reports;
    let runs;
    try {
      [config, reports, runs] = await Promise.all([
        this.db.query(
          `SELECT metadata->'competitors' AS competitors
           FROM documents
           WHERE id = md5($1::text || ':wf11-config')::uuid
             AND organization_id = $1::uuid
             AND metadata->>'source' = 'wf11_config'`,
          [organizationId],
        ),
        this.db.query(
          `SELECT id, file_name, extracted_text, metadata, created_at
           FROM documents
           WHERE organization_id = $1 AND metadata->>'source' = 'wf11'
           ORDER BY created_at DESC
           LIMIT 10`,
          [organizationId],
        ),
        this.db.query(
          `SELECT id, status, correlation_id, input, output, error, started_at, finished_at
           FROM workflow_runs
           WHERE organization_id = $1 AND workflow_key = 'WF-11'
           ORDER BY started_at DESC
           LIMIT 20`,
          [organizationId],
        ),
      ]);
    } catch (error) {
      this.logger.error(
        'Failed to load WF-11 dashboard data',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    return {
      competitors: config.rows[0]?.competitors ?? DEFAULT_WF11_COMPETITORS,
      reports: reports.rows,
      runs: runs.rows,
    };
  }

  async findWf11RunByCorrelationId(
    organizationId: string,
    correlationId: string,
  ) {
    const result = await this.db.query(
      `SELECT id, status, correlation_id, input, output, error,
              started_at, finished_at
       FROM workflow_runs
       WHERE organization_id = $1
         AND workflow_key = 'WF-11'
         AND correlation_id = $2::uuid
       ORDER BY started_at DESC
       LIMIT 1`,
      [organizationId, correlationId],
    );
    return result.rows[0] ?? null;
  }

  async saveWf11Competitors(organizationId: string, value: unknown) {
    if (
      !Array.isArray(value) ||
      value.length === 0 ||
      value.length > 8 ||
      value.some(
        (name) =>
          typeof name !== 'string' ||
          !name.trim() ||
          name.trim().length > 80,
      )
    ) {
      throw new BadRequestException(
        'competitors must contain between 1 and 8 names, each up to 80 characters',
      );
    }

    const competitors = [...new Set(value.map((name: string) => name.trim()))];
    if (competitors.length !== value.length) {
      throw new BadRequestException('Competitor names must be unique');
    }

    const metadata = {
      source: 'wf11_config',
      type: 'competitor_config',
      competitors,
    };
    const saved = await this.db.query(
      `INSERT INTO documents (
         id, organization_id, file_name, mime_type, extracted_text, metadata
       )
       VALUES (
         md5($1::text || ':wf11-config')::uuid,
         $1::uuid,
         'wf11-monitoring-config.json',
         'application/json',
         $2::text,
         $3::jsonb
       )
       ON CONFLICT (id) DO UPDATE
       SET extracted_text = EXCLUDED.extracted_text,
           metadata = EXCLUDED.metadata,
           created_at = NOW()
       WHERE documents.organization_id = EXCLUDED.organization_id
         AND documents.metadata->>'source' = 'wf11_config'
       RETURNING id`,
      [organizationId, JSON.stringify(competitors), JSON.stringify(metadata)],
    );

    if (!saved.rowCount) {
      throw new ConflictException('Unable to save WF-11 competitor settings');
    }

    return { competitors };
  }
}
