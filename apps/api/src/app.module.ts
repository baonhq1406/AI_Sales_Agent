import { Module } from '@nestjs/common';
import { DashboardAiService } from './dashboard-ai.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { HealthController } from './health.controller';
import { DatabaseService } from './database.service';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { WorkflowRunsController } from './workflow-runs.controller';
import { WorkflowRunsService } from './workflow-runs.service';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  controllers: [
    HealthController,
    DashboardController,
    LeadsController,
    EventsController,
    WorkflowRunsController,
    ApprovalsController,
  ],
  providers: [
    DatabaseService,
    DashboardService,
    DashboardAiService,
    ApiKeyGuard,
    LeadsService,
    EventsService,
    WorkflowRunsService,
    ApprovalsService,
  ],
})
export class AppModule {}
