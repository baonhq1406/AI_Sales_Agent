import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  IsEmail,
  IsString,
  MinLength,
} from 'class-validator';
import { AuthService } from './auth.service';
import { SaleAuthGuard } from './sale-auth.guard';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }

  @UseGuards(SaleAuthGuard)
  @Get('me')
  me(
    @Request() req: {
      saleUser: {
        id: string;
        organizationId: string;
        role: string;
      };
    },
  ) {
    return req.saleUser;
  }
}
