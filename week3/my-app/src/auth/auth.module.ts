import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: 'SECRET_KEY_SMART_GARDEN_IOT_SECURITY',
    }),
  ],
  providers: [AuthService], // PrismaService is loaded via global PrismaModule
  controllers: [AuthController],
})
export class AuthModule {}