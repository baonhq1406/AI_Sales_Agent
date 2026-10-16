import { SaleAuthGuard } from './sale-auth.guard';
import {Body,Controller,Get,Param,Post,ServiceUnavailableException,Request,UseGuards} from '@nestjs/common'; import {ApiKeyGuard} from './api-key.guard'; import {ApprovalDecisionDto} from './approvals.dto'; import {ApprovalsService} from './approvals.service';
@Controller('approvals') @UseGuards(ApiKeyGuard) export class ApprovalsController {constructor(private readonly s:ApprovalsService){} @UseGuards(SaleAuthGuard)
 @Get('pending')
 listPending(
  @Request() req: {
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
 @Post(':id/decision') decide(
  @Param('id') id: string,
  @Body() d: ApprovalDecisionDto,
  @Request() req: {
    saleUser: {
      id: string;
      organizationId: string;
      role: string;
    };
  },
) {
  return this.s.decide(
    id,
    d,
    req.saleUser.id,
    req.saleUser.organizationId,
  );
}}
