import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AUTH_SERVICE, JwtTcpGuard, RolesGuard, TCP_DEFAULT_HOST } from '@app/common';
import { DatabaseModule } from '@app/database';

import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { Employee } from './entities/employee.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule.forRoot(),
    TypeOrmModule.forFeature([Employee]),
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
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
export class EmployeeModule {}
