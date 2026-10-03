import { Module } from '@nestjs/common';
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
    LeadsController,
    EventsController,
    WorkflowRunsController,
    ApprovalsController,
  ],
  providers: [
    DatabaseService,
    ApiKeyGuard,
    LeadsService,
    EventsService,
    WorkflowRunsService,
    ApprovalsService,
  ],
})
export class AppModule {}
