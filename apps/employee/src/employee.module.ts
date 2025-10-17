import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AUTH_SERVICE, JwtTcpGuard, RolesGuard, TCP_DEFAULT_HOST } from '@app/common';
import { DatabaseModule } from '@app/database';

import { EmployeeAdminController } from './employee-admin.controller';
import { EmployeeRpcController } from './employee-rpc.controller';
import { EmployeeSelfController } from './employee-self.controller';
import { EmployeeService } from './employee.service';
import { EmployeeProfile } from './entities/employee.entity';
import { ProfileChangeLog } from './entities/profile-change-log.entity';
import { FirebaseModule } from './firebase/firebase.module';
import { PhotoStorageService } from './storage/photo-storage.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule.forRoot(),
    FirebaseModule,
    TypeOrmModule.forFeature([EmployeeProfile, ProfileChangeLog]),
  ],
  controllers: [EmployeeAdminController, EmployeeSelfController, EmployeeRpcController],
  providers: [
    EmployeeService,
    PhotoStorageService,
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
