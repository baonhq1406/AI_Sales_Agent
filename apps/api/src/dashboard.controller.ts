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

  @Get('overview')
  getOverview() {
    const organizationId = process.env.DASHBOARD_ORGANIZATION_ID;

    if (!organizationId) {
      throw new ServiceUnavailableException(
        'DASHBOARD_ORGANIZATION_ID is not configured',
      );
    }

    return this.dashboard.getOverview(organizationId);
  }

  @Get('charts')
  getCharts() {
    const organizationId = process.env.DASHBOARD_ORGANIZATION_ID;

    if (!organizationId) {
      throw new ServiceUnavailableException(
        'DASHBOARD_ORGANIZATION_ID is not configured',
      );
    }

    return this.dashboard.getCharts(organizationId);
  }

  @Get('insights')
  getInsights() {
    const organizationId = process.env.DASHBOARD_ORGANIZATION_ID;

    if (!organizationId) {
      throw new ServiceUnavailableException(
        'DASHBOARD_ORGANIZATION_ID is not configured',
      );
    }

    return this.dashboardAi.getInsights(organizationId);
  }
}
