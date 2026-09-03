import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('UserService', () => {
  let service: UserService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return user details if user exists', async () => {
      const mockUser = { id: 1, name: 'Nguyen Van A', email: 'a@example.com', role: Role.USER, gardens: [] };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if regular user deletes another account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 2 });

      await expect(
        service.remove(2, { id: 1, email: 'u1@test.com', role: Role.USER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow user to delete their own account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.user.delete.mockResolvedValue({ id: 1 });

      const res = await service.remove(1, { id: 1, email: 'u1@test.com', role: Role.USER });
      expect(res).toEqual({ message: 'Successfully deleted user with ID 1' });
    });
  });
});