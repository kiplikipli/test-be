import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AUTH_SERVICE, JwtTcpGuard, RolesGuard, TCP_DEFAULT_HOST } from '@app/common';
import { DatabaseModule } from '@app/database';

import { AttendanceAdminController } from './attendance-admin.controller';
import { AttendanceHttpController } from './attendance-http.controller';
import { AttendanceRpcController } from './attendance-rpc.controller';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule.forRoot(),
    TypeOrmModule.forFeature([Attendance]),
  ],
  controllers: [AttendanceHttpController, AttendanceAdminController, AttendanceRpcController],
  providers: [
    AttendanceService,
    JwtTcpGuard,
    RolesGuard,
    {
      provide: AUTH_SERVICE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_TCP_HOST', TCP_DEFAULT_HOST),
            port: Number(configService.get<number>('AUTH_TCP_PORT', 4001)),
          },
        }),
    },
  ],
})
export class AttendanceModule {}
