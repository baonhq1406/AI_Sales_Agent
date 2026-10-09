import { DashboardAiService } from './dashboard-ai.service';
import {
  Controller,
  Get,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(ApiKeyGuard)
export class DashboardController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly dashboardAi: DashboardAiService,
  ) {}

  private getOrgId(): string {
    return process.env.DASHBOARD_ORGANIZATION_ID || '11111111-1111-4111-8111-111111111111';
  }

  @Get('overview')
  getOverview() {
    return this.dashboard.getOverview(this.getOrgId());
  }

  @Get('charts')
  getCharts() {
    return this.dashboard.getCharts(this.getOrgId());
  }

  @Get('insights')
  getInsights() {
    return this.dashboardAi.getInsights(this.getOrgId());
  }
}
