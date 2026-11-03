import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
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

  @UseGuards(SaleAuthGuard)
  @Get('wf11')
  listWf11(
    @Request()
    req: {
      saleUser: {
        organizationId: string;
      };
    },
  ) {
    return this.s.findWf11ByOrganization(req.saleUser.organizationId);
  }

  @UseGuards(SaleAuthGuard)
  @Get('wf11/status/:correlationId')
  getWf11RunStatus(
    @Request()
    req: {
      saleUser: {
        organizationId: string;
      };
    },
    @Param('correlationId') correlationId: string,
  ) {
    return this.s.findWf11RunByCorrelationId(
      req.saleUser.organizationId,
      correlationId,
    );
  }

  @UseGuards(SaleAuthGuard)
  @Put('wf11/competitors')
  saveWf11Competitors(
    @Request()
    req: {
      saleUser: {
        organizationId: string;
      };
    },
    @Body() body: { competitors?: unknown },
  ) {
    return this.s.saveWf11Competitors(
      req.saleUser.organizationId,
      body?.competitors,
    );
  }

  @Get(':id')
  find(@Param('id') id: string) {
    return this.s.findById(id);
  }
}
