import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { JwtUser } from './jwt-payload.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() body: { username?: string; password?: string }) {
    return this.auth.register(body.username ?? '', body.password ?? '');
  }

  @Post('login')
  login(@Body() body: { username?: string; password?: string }) {
    return this.auth.login(body.username ?? '', body.password ?? '');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user);
  }
}
