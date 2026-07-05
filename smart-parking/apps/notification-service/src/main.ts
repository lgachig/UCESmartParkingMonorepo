import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, { exclude: ['metrics', 'docs'] });

  const config = new DocumentBuilder()
    .setTitle('UCE Smart Parking — Notification Service')
    .setDescription('Servicio event-driven: consume Kafka (reservas, alertas de sistema) y RabbitMQ (eventos de pago), envía emails vía SMTP.')
    .setVersion('1.0')
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config), {
    useGlobalPrefix: false,
  });

  const port = process.env.NOTIFICATION_SERVICE_PORT || 3011;
  await app.listen(port);
  Logger.log(`🚀 notification-service running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  Logger.log(`❤️  Health: http://localhost:${port}/${globalPrefix}/health`);
  Logger.log(`📊 Metrics: http://localhost:${port}/metrics`);
}

bootstrap();