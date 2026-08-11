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

  // Validate required environment variables at application startup
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  for (const envVar of requiredEnvVars) {
    if (!configService.get(envVar)) {
      logger.error(`Missing critical environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  // Enable global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Register global Prisma exception filter
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  // Connect MQTT Microservice to handle background MQTT messages
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.MQTT,
    options: {
      url: 'mqtt://broker.hivemq.com:1883',
    },
  });

  // Configure Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('YootexIOT Intern API Documentation')
    .setDescription('RESTful API & MQTT Microservice documentation')
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
  SwaggerModule.setup('api', app, document);

  // Start both MQTT Microservice and HTTP Web Server
  await app.startAllMicroservices();
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  logger.log(`HTTP & WebSockets running on: http://localhost:${port}`);
  logger.log(`MQTT Microservice connected to: mqtt://broker.hivemq.com:1883`);
  logger.log(`Swagger UI documentation available at: http://localhost:${port}/api`);
}
bootstrap();