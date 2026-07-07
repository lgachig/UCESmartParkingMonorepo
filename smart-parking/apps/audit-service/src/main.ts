import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './app/filters/http-exception.filter';
import { TransformResponseInterceptor } from './app/interceptors/transform-response.interceptor';
import { winstonConfig } from './app/logger/logger.config';
import { applyCors, configureHelmet } from '../../../shared/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonConfig }),
  });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api', { exclude: ['metrics', 'docs'] });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  applyCors(app, configService);
  app.use(configureHelmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Smart Parking Audit API')
    .setDescription(
      'Immutable audit trail microservice for Smart Parking (USP-109: read-only admin query endpoint)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, { useGlobalPrefix: false });

  const port = configService.get<number>('AUDIT_SERVICE_PORT') || 3012;
  await app.listen(port);
  Logger.log(`🚀 Audit Service running on: http://localhost:${port}/api`);
  Logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  Logger.log(`📊 Metrics: http://localhost:${port}/metrics`);
  Logger.log(`📝 Logs file: logs/audit-service.log`);
}

bootstrap();
