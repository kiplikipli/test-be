import { Body, Controller, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MessagePatterns } from '@app/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern(MessagePatterns.AUTH.VALIDATE)
  validateToken(@Payload('token') token: string) {
    return this.authService.validateToken(token);
  }
}
