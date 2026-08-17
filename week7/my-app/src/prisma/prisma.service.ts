import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config'; // Load environment variables globally

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Prisma v7+ strictly requires a Driver Adapter to connect
    const adapter = new PrismaPg({ 
      connectionString: process.env.DATABASE_URL as string 
    });
    
    super({ 
      adapter 
    });
  }

  // Establish connection when module initializes
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error('Prisma connection error during initialization:', error);
    }
  }

  // Teardown connection gracefully
  async onModuleDestroy() {
    await this.$disconnect();
  }
}