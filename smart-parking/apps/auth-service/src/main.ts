import { Logger, ValidationPipe} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { winstonConfig } from './app/logger/logger.config';
import { WinstonModule } from 'nest-winston';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule, } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,
  {
    logger: WinstonModule.createLogger({
      instance: winstonConfig,
    }),
  },);

  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,}),
  );
  // Enable CORS for specific origins
  app.enableCors({
    origin: [
      'http://localhost:3000'
    ],
    credentials: true,
  });

  const config = new DocumentBuilder().setTitle('Smart Parking Auth API',)
    .setDescription( 'Authentication microservice for Smart Parking',)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app,
                                                config,);

  SwaggerModule.setup('docs',
                      app,
                      document,);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();