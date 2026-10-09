import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
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
import { SaleAuthGuard } from './sale-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AuthController,
    HealthController,
    LeadsController,
    EventsController,
    WorkflowRunsController,
    ApprovalsController,
  ],
  providers: [
    SaleAuthGuard,
    AuthService,
    DatabaseService,
    ApiKeyGuard,
    LeadsService,
    EventsService,
    WorkflowRunsService,
    ApprovalsService,
  ],
})
export class AppModule {}
