import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
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
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';
import { VoiceWorkflowsController } from './voice-workflows.controller';
import { VoiceWorkflowsService } from './voice-workflows.service';
import { ApiKeyGuard } from './api-key.guard';
import { SaleAuthGuard } from './sale-auth.guard';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AuthController,
    HealthController,
    DashboardController,
    LeadsController,
    EventsController,
    WorkflowRunsController,
    ApprovalsController,
    InteractionsController,
    VoiceWorkflowsController,
    KnowledgeController,
  ],
  providers: [
    SaleAuthGuard,
    AuthService,
    DatabaseService,
    DashboardService,
    DashboardAiService,
    ApiKeyGuard,
    LeadsService,
    EventsService,
    WorkflowRunsService,
    ApprovalsService,
    InteractionsService,
    VoiceWorkflowsService,
    KnowledgeService,
  ],
})
export class AppModule {}
