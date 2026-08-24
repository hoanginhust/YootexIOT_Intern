import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

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

  it('should throw on duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: 'a@example.com' });

    await expect(service.register({ name: 'A', email: 'a@example.com', password: '123456' } as any)).rejects.toThrow(BadRequestException);
  });

  it('should throw on invalid login credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.login({ email: 'a@example.com', password: '123456' } as any)).rejects.toThrow(UnauthorizedException);
  });
});
