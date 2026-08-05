import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filter/prisma-client-exception.filter'; // Import filter

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // 1. Validate required environment variables at application startup
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
  for (const envVar of requiredEnvVars) {
    if (!configService.get(envVar)) {
      logger.error(`Missing critical environment variable: ${envVar}`);
      process.exit(1); // Stop process if missing critical configuration
    }
  }

  // Enable global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Register global Prisma exception filter to handle database errors
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  // 2. Configure Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('YootexIOT Intern API Documentation')
    .setDescription('RESTful API documentation with JWT Authentication and Prisma ORM')
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
      'JWT-auth', // Authentication key referenced by @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document); // Setup Swagger UI at http://localhost:3000/api

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger UI documentation available at: http://localhost:${port}/api`);
}
bootstrap();