import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const tcpOptions: MicroserviceOptions = {
    transport: Transport.TCP,
    options: {
      host: configService.get<string>('TCP_HOST', '0.0.0.0'),
      port: Number(configService.get<string>('TCP_PORT') ?? 4001),
    },
  };

  app.connectMicroservice(tcpOptions);
  await app.startAllMicroservices();

  const httpPort = Number(configService.get<string>('HTTP_PORT') ?? 3000);
  await app.listen(httpPort);
}

bootstrap();
