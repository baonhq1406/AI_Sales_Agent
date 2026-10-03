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

  async decide(id: string, decision: ApprovalDecisionDto) {
    const current = await this.db.query(
      'SELECT status FROM approvals WHERE id = $1',
      [id],
    );

    if (!current.rowCount) {
      throw new NotFoundException('Approval not found');
    }

    if (current.rows[0].status !== 'pending') {
      throw new ConflictException('Approval has already been decided');
    }

    try {
      const result = await this.db.query(
        `UPDATE approvals
         SET status = $1,
             approved_by = $2,
             decision_note = $3,
             decided_at = NOW()
         WHERE id = $4 AND status = 'pending'
         RETURNING *`,
        [
          decision.status,
          decision.approvedBy,
          decision.decisionNote ?? null,
          id,
        ],
      );

      if (!result.rowCount) {
        throw new ConflictException('Approval was decided concurrently');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      if ((error as { code?: string }).code === '23503') {
        throw new ConflictException('approvedBy user does not exist');
      }

      throw error;
    }
  }
}
