import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, { exclude: ['metrics', 'docs'] });
  const port = process.env.NOTIFICATION_SERVICE_PORT || 3011;
  await app.listen(port);
  Logger.log(`🚀 notification-service running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();