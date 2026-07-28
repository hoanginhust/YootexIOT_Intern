import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Module({
  providers: [UsersService, PrismaService, AuthService],
  controllers: [UsersController]
})
export class UsersModule {}