import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Create connection pool instance required by @prisma/adapter-pg
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
  }

  // Connect to database on module initialization
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL database successfully.');
    } catch (error) {
      this.logger.error('Prisma connection error during initialization:', error);
    }
  }

  // Gracefully close connection on teardown
  async onModuleDestroy() {
    await this.$disconnect();
  }
}