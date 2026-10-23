import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { ApprovalDecisionDto } from './approvals.dto';
import { ApprovalsService } from './approvals.service';
import { SaleAuthGuard } from './sale-auth.guard';

@Controller('approvals')
@UseGuards(ApiKeyGuard)
export class ApprovalsController {
  constructor(private readonly s: ApprovalsService) {}

  @UseGuards(SaleAuthGuard)
  @Get('pending')
  listPending(
    @Request()
    req: {
      saleUser: {
        id: string;
        organizationId: string;
        role: string;
      };
    },
  ) {
    return this.s.findPending(req.saleUser.organizationId);
  }

  @UseGuards(SaleAuthGuard)
  @Post(':id/decision')
  decide(
    @Param('id') id: string,
    @Body() d: ApprovalDecisionDto,
    @Request()
    req: {
      saleUser: {
        id: string;
        organizationId: string;
        role: string;
      };
    },
  ) {
    if (req.saleUser.role !== 'admin') {
      throw new ForbiddenException(
        'Chỉ Quản lý (Admin) mới có thẩm quyền phê duyệt chiết khấu hoặc phát hành hợp đồng',
      );
    }
    return this.s.decide(
      id,
      d,
      req.saleUser.id,
      req.saleUser.organizationId,
    );
  }
}
