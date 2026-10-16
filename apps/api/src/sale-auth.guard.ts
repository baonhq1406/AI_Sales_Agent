import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from './database.service';

@Injectable()
export class SaleAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;

    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException('JWT is required');
    }

    const token = authorization.slice(7);

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new ServiceUnavailableException(
        'JWT_SECRET is not configured',
      );
    }

    let payload: {
      sub: string;
      organizationId: string;
    };

    try {
      payload = await this.jwt.verifyAsync(token, {
        secret,
        issuer: 'ai-sales-agent',
        audience: 'ai-sales-agent-web',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired JWT');
    }

    if (
      !payload ||
      typeof payload.sub !== 'string' ||
      typeof payload.organizationId !== 'string'
    ) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    const result = await this.db.query(
      `SELECT id, organization_id, role
       FROM users
       WHERE id = $1 AND organization_id = $2`,
      [payload.sub, payload.organizationId],
    );

    if (result.rowCount !== 1) {
      throw new UnauthorizedException('User not found');
    }

    const user = result.rows[0];

    if (!['sale', 'admin'].includes(user.role)) {
      throw new ForbiddenException('Sale permission required');
    }

    request.saleUser = {
      id: user.id,
      organizationId: user.organization_id,
      role: user.role,
    };

    return true;
  }
}
