import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // New account registration API and Password encryption
  async register(dto: any) {
    const userExist = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (userExist) throw new BadRequestException('Email already in use.');

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true }, // Hide the hashed password when returning the user
    });
  }

  // API Login to obtain a JWT Token
  async login(dto: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid email or password.');

    // Compare the plain text password with the hashed password in the database
    const isPasswordMatch = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordMatch) throw new UnauthorizedException('Invalid email or password.');

    // Generate the JWT token
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}