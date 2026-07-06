import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './app/filters/http-exception.filter';
import { winstonConfig } from './app/logger/logger.config';
import { RedisIoAdapter } from './app/realtime/redis-io.adapter';
import { applyCors, configureHelmet } from '../../../shared/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonConfig }),
  });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api', { exclude: ['metrics', 'docs'] });
  app.useGlobalFilters(new HttpExceptionFilter());
  applyCors(app, configService);
  app.use(configureHelmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  const config = new DocumentBuilder()
    .setTitle('Smart Parking Realtime API')
    .setDescription(
      'Endpoints HTTP de health y metrics para realtime-service. ' +
      'Las actualizaciones de disponibilidad en tiempo real se sirven por WebSocket ' +
      '(Socket.IO) en el namespace /realtime, no están documentadas aquí.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: false });

  const port = configService.get<number>('REALTIME_SERVICE_PORT') || 3008;
  await app.listen(port);
  Logger.log(`🚀 Realtime Service running on: http://localhost:${port}/api`);
  Logger.log(`🔌 WebSocket namespace: ws://localhost:${port}/realtime`);
  Logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  Logger.log(`📊 Metrics: http://localhost:${port}/metrics`);
  Logger.log(`📝 Logs file: logs/realtime-service.log`);
}

bootstrap();