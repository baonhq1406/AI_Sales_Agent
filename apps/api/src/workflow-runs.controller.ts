import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { SaleAuthGuard } from './sale-auth.guard';
import { WorkflowRunsService } from './workflow-runs.service';

@Controller('workflow-runs')
@UseGuards(ApiKeyGuard)
export class WorkflowRunsController {
  constructor(private readonly s: WorkflowRunsService) {}

  @UseGuards(SaleAuthGuard)
  @Get('wf08')
  listWf08(
    @Request()
    req: {
      saleUser: {
        organizationId: string;
      };
    },
  ) {
    return this.s.findWf08ByOrganization(req.saleUser.organizationId);
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.s.findById(id);
  }
}
