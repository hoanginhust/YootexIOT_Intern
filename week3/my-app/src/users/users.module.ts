import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma.service';
import { AuthService } from '../auth/auth.service';

@Module({
  providers: [UsersService, PrismaService, AuthService],
  controllers: [UsersController]
})
export class UsersModule {}