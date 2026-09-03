import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwt = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw BadRequestException on duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@example.com' });

      await expect(
        service.register({ name: 'A', email: 'a@example.com', password: 'password123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully hash password and create new user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pwd');
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        name: 'A',
        email: 'a@example.com',
        role: Role.USER,
      });

      const result = await service.register({ name: 'A', email: 'a@example.com', password: 'password123' });
      expect(result.id).toBe(1);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: Role.USER,
          password: 'hashed_pwd',
        }),
        select: expect.any(Object),
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException on invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'a@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException on mismatched password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, password: 'hashed_pwd' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'a@example.com', password: 'wrong_password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return signed JWT access token on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@example.com',
        password: 'hashed_pwd',
        role: Role.USER,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.signAsync.mockResolvedValue('jwt_token_example');

      const res = await service.login({ email: 'a@example.com', password: 'password123' });
      expect(res).toEqual({ access_token: 'jwt_token_example' });
    });
  });
});