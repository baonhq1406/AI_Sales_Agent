import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected) throw new ServiceUnavailableException('INTERNAL_API_KEY is not configured');
    const actual = context.switchToHttp().getRequest<Request>().header('x-api-key');
    if (!actual) throw new UnauthorizedException('X-API-Key header is required');
    const a=Buffer.from(actual), b=Buffer.from(expected);
    if (a.length!==b.length || !timingSafeEqual(a,b)) throw new UnauthorizedException('Invalid API key');
    return true;
  }
}
