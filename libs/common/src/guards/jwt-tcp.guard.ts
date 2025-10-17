import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { lastValueFrom } from 'rxjs';

import { AUTH_SERVICE } from '../constants';
import { MessagePatterns } from '../message-patterns';
import { AuthenticatedUser } from '../interfaces/auth-user.interface';

@Injectable()
export class JwtTcpGuard implements CanActivate {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');

    if (!token || scheme?.toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Invalid authorization scheme');
    }

    try {
      const user = await lastValueFrom(
        this.authClient.send<AuthenticatedUser, { token: string }>(MessagePatterns.AUTH.VALIDATE, {
          token,
        }),
      );

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException((error as Error)?.message ?? 'Token validation failed');
    }
  }
}
