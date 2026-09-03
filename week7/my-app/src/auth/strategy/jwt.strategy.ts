import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ActiveUserData } from '../interface/active-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'SUPER_SECRET_KEY',
    });
  }

  // Validate user existence and map verified payload
  async validate(payload: ActiveUserData): Promise<ActiveUserData> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}