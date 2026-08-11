import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Register a new user with default 'USER' role
  async register(dto: RegisterDto) {
    const userExist = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (userExist) throw new BadRequestException('Email already in use.');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'USER', // Always force default role as USER for safety
      },
      select: { id: true, 
                name: true, 
                email: true, 
                role: true, 
                createdAt: true, 
                updatedAt: true, }, // Hide password
    });
  }

  // Validate credentials and sign token with user id and role
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const isPasswordMatch = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordMatch) throw new UnauthorizedException('Invalid credentials.');

    // Embed id and role into the JWT payload for authorization
    const payload = { id: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}