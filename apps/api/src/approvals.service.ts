import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ApprovalDecisionDto } from './approvals.dto';

@Injectable()
export class ApprovalsService {
  constructor(private readonly db: DatabaseService) {}


  async findPending(organizationId: string) {
    const result = await this.db.query(
      `SELECT id, entity_type, entity_id, approval_type,
              status, payload, requested_at
       FROM approvals
       WHERE organization_id = $1
         AND status = 'pending'
         AND approval_type ILIKE '%quote%'
       ORDER BY requested_at DESC
       LIMIT 100`,
      [organizationId],
    );

    return result.rows;
  }

  async decide(
    id: string,
    decision: ApprovalDecisionDto,
    userId: string,
    organizationId: string,
  ) {
    const result = await this.db.query(
      `UPDATE approvals
       SET status = $1,
           approved_by = $2,
           decision_note = $3,
           decided_at = NOW()
       WHERE id = $4
         AND organization_id = $5
         AND status = 'pending'
         AND approval_type ILIKE '%quote%'
       RETURNING *`,
      [
        decision.status,
        userId,
        decision.decisionNote ?? null,
        id,
        organizationId,
      ],
    );

    if (!result.rowCount) {
      throw new ConflictException(
        'Không tìm thấy báo giá đang chờ duyệt hoặc đã được xử lý',
      );
    }

    return result.rows[0];
  }
}
