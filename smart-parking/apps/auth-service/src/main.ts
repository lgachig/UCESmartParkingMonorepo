import { Logger, ValidationPipe} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { winstonConfig } from './app/logger/logger.config';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule, } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './app/filters/http-exception.filter';
import { TransformResponseInterceptor } from './app/interceptors/transform-response.interceptor';
import { applyCors } from '../../../shared/cors';

async function bootstrap() {

  const app = await NestFactory.create(AppModule,
  {
    logger: WinstonModule.createLogger({
      instance: winstonConfig,
    }),
  },);

  const configService = app.get(ConfigService);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, { exclude: ['metrics'] });
  app.useGlobalFilters( new HttpExceptionFilter(),);
  app.useGlobalInterceptors( new TransformResponseInterceptor(), );
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,}),
  );
  applyCors(app, configService);

  const config = new DocumentBuilder().setTitle('Smart Parking Auth API',)
    .setDescription( 'Authentication microservice for Smart Parking',)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config,);

  SwaggerModule.setup('docs', app, document,);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`📊 Metrics: http://localhost:${port}/metrics`);
  Logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  Logger.log(`📝 Logs file: logs/auth-service.log`);
}

bootstrap();