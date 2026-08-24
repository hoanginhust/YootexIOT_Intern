process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filter/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Enable CORS for frontend connection
  app.enableCors();

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Validate required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  for (const envVar of requiredEnvVars) {
    if (!configService.get(envVar)) {
      logger.error(`Missing critical environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Enable global validation pipe for DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Register global Prisma exception filter
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  // Connect MQTT Microservice with URL from env
  const mqttUrl = configService.get<string>('MQTT_URL') || 'mqtt://broker.hivemq.com:1883';
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: mqttUrl,
    },
  });

  // Configure Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smart Garden IoT Management System API')
    .setDescription('RESTful API & MQTT/WebSocket Microservice documentation for Smart Garden System')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT Authorization',
        description: 'Enter JWT token here',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Start microservices and HTTP server
  await app.startAllMicroservices();
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  logger.log(`HTTP & WebSockets running on: http://localhost:${port}/api`);
  logger.log(`Swagger UI available at: http://localhost:${port}/api/docs`);
}
bootstrap();
