import {
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from './database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const result = await this.db.query(
      `SELECT u.id, u.organization_id, u.email,
              u.display_name, u.role, c.password_hash
       FROM users u
       JOIN user_credentials c ON c.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 2`,
      [email],
    );

    if (result.rowCount !== 1) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (!process.env.JWT_SECRET) {
      throw new ServiceUnavailableException(
        'JWT_SECRET chưa được cấu hình',
      );
    }

    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        organizationId: user.organization_id,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h',
        issuer: 'ai-sales-agent',
        audience: 'ai-sales-agent-web',
      },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
      },
    };
  }
}
