import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

  async query(text: string, values: unknown[] = []) {
    return this.pool.query(text, values);
  }

  async ping() {
    const result = await this.pool.query(
      'SELECT NOW() as now, current_database() as database',
    );
    return result.rows[0];
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
