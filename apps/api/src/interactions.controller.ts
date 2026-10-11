import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { SaleAuthGuard } from './sale-auth.guard';
import { InteractionsService } from './interactions.service';

@Controller('interactions')
@UseGuards(ApiKeyGuard)
export class InteractionsController {
  constructor(private readonly service: InteractionsService) {}

  @Get()
  list(
    @Query('channel') channel?: string,
    @Query('organizationId') queryOrgId?: string,
  ) {
    const orgId = queryOrgId || process.env.DASHBOARD_ORGANIZATION_ID || '11111111-1111-4111-8111-111111111111';
    return this.service.findAll(orgId, channel);
  }
}
