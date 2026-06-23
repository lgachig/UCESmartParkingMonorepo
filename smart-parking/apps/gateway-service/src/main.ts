import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './app/filters/http-exception.filter';
import { winstonConfig } from './app/logger/logger.config';
import { applyCors, configureHelmet } from '../../../shared/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonConfig }),
    rawBody: true,
  });

  const configService = app.get(ConfigService);

  app.useGlobalFilters(new HttpExceptionFilter());
  applyCors(app, configService);
  app.use(configureHelmet());

  const config = new DocumentBuilder()
    .setTitle('UCE Smart Parking — API Gateway')
    .setDescription(
      'Punto de entrada único. Enruta a: auth-service (3000), user-service (3001), vehicle-service (3003), parking-service (3004), reservation-service (3005).',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:3006', 'Local Gateway')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = configService.get<number>('GATEWAY_PORT') || 3006;
  await app.listen(port);

  Logger.log(`🚀 API Gateway:   http://localhost:${port}/api`);
  Logger.log(`📚 Swagger docs:  http://localhost:${port}/docs`);
  Logger.log(`❤️  Health:        http://localhost:${port}/health`);
  Logger.log(`📊 Metrics:       http://localhost:${port}/metrics`);
}

bootstrap();