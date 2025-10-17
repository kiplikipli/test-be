import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';

import { AuthenticatedUser, Role } from '@app/common';

import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
  exp: number;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly jwtSecret: string;
  private readonly tokenTtlSeconds: number;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    configService: ConfigService,
  ) {
    this.jwtSecret = configService.get<string>('JWT_SECRET', 'change-me');
    const ttl = configService.get<string>('JWT_TTL_SECONDS');
    this.tokenTtlSeconds = ttl ? Number(ttl) : 3600;
  }

  async onModuleInit(): Promise<void> {
    const totalUsers = await this.usersRepository.count();
    if (totalUsers === 0) {
      const admin = this.usersRepository.create({
        email: 'admin@example.com',
        password: 'password',
        roles: [Role.ADMIN],
      });
      await this.usersRepository.save(admin);
    }
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    const user = await this.usersRepository.findOne({ where: { email: dto.email } });

    if (!user || user.password !== dto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.signToken(user);

    return {
      accessToken: token,
      user: this.mapToAuthenticatedUser(user),
    };
  }

  async validateToken(token: string): Promise<AuthenticatedUser> {
    const payload = this.verifyToken(token);

    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapToAuthenticatedUser(user);
  }

  private signToken(user: User): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      exp: Math.floor(Date.now() / 1000) + this.tokenTtlSeconds,
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const data = `${base64Header}.${base64Payload}`;
    const signature = this.createSignature(data);

    return `${data}.${signature}`;
  }

  private verifyToken(token: string): JwtPayload {
    const segments = token.split('.');
    if (segments.length !== 3) {
      throw new UnauthorizedException('Malformed token');
    }

    const [encodedHeader, encodedPayload, signature] = segments;
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = this.createSignature(data);

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const payload: JwtPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

    if (payload.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }

  private createSignature(data: string): string {
    return createHmac('sha256', this.jwtSecret).update(data).digest('base64url');
  }

  private mapToAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
    };
  }
}
