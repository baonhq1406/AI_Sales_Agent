import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getOverview(organizationId: string) {
    const result = await this.db.query(
      `
      SELECT
        (SELECT COUNT(*)::int
         FROM leads
         WHERE organization_id = $1) AS total_leads,

        (SELECT COUNT(*)::int
         FROM interactions
         WHERE organization_id = $1) AS total_interactions,

        (SELECT ROUND(AVG(score), 2)
         FROM leads
         WHERE organization_id = $1) AS avg_lead_score,

        (SELECT ROUND(AVG(health_score), 2)
         FROM customer_profiles
         WHERE organization_id = $1) AS avg_health_score,

        (SELECT COUNT(*)::int
         FROM customer_profiles
         WHERE organization_id = $1
           AND churn_risk >= 70) AS high_churn_customers,

        (SELECT COUNT(*)::int
         FROM agent_tasks
         WHERE organization_id = $1
           AND status = 'pending') AS pending_tasks
      `,
      [organizationId],
    );

    return result.rows[0];
  }

  async getCharts(organizationId: string) {
    const leads = await this.db.query(
      `SELECT status, COUNT(*)::int AS total
       FROM leads
       WHERE organization_id = $1
       GROUP BY status
       ORDER BY total DESC`,
      [organizationId],
    );

    const interactions = await this.db.query(
      `SELECT channel, COUNT(*)::int AS total
       FROM interactions
       WHERE organization_id = $1
       GROUP BY channel
       ORDER BY total DESC`,
      [organizationId],
    );

    return {
      leads_by_status: leads.rows,
      interactions_by_channel: interactions.rows,
    };
  }
}
