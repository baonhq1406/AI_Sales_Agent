import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  health() {
    return { status: 'ok', service: 'ai-sales-agent-api', version: '0.1.0', timestamp: new Date().toISOString() };
  }

  @Get('db')
  async databaseHealth() {
    try {
      const result = await this.database.ping();
      return { status: 'ok', database: result.database, checkedAt: result.now };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'unavailable' });
    }
  }
}
