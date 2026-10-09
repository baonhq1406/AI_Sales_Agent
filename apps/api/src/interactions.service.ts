import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class InteractionsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(organizationId: string, channel?: string) {
    let query = `
      SELECT i.id, i.organization_id, i.lead_id, i.channel, i.direction,
             i.interaction_type, i.subject, i.transcript, i.occurred_at,
             i.metadata, i.created_at,
             l.first_name, l.last_name, l.company_name, l.phone, l.email
      FROM interactions i
      LEFT JOIN leads l ON l.id = i.lead_id
      WHERE i.organization_id = $1
    `;
    const params: (string | undefined)[] = [organizationId];

    if (channel) {
      query += ` AND i.channel = $2`;
      params.push(channel);
    }

    query += ` ORDER BY i.created_at DESC LIMIT 100`;

    const result = await this.db.query(query, params);
    return result.rows;
  }
}
