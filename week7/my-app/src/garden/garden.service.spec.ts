import { Test, TestingModule } from '@nestjs/testing';
import { GardenService } from './garden.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('GardenService', () => {
  let service: GardenService;

  const mockPrisma = {
    garden: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GardenService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<GardenService>(GardenService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should throw when garden is missing', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, { id: 1, email: 'u@test.com', role: Role.USER })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should deny access for non-owner user', async () => {
      mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 2 });

      await expect(service.findOne(1, { id: 9, email: 'other@test.com', role: Role.USER })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow ADMIN to view any garden', async () => {
      const mockGarden = { id: 1, name: 'Garden A', ownerId: 2 };
      mockPrisma.garden.findUnique.mockResolvedValue(mockGarden);

      const result = await service.findOne(1, { id: 99, email: 'admin@test.com', role: Role.ADMIN });
      expect(result).toEqual(mockGarden);
    });
  });

  describe('findAll', () => {
    it('should return all gardens for ADMIN', async () => {
      mockPrisma.garden.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await service.findAll({ id: 99, email: 'admin@test.com', role: Role.ADMIN });
      expect(mockPrisma.garden.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
      });
    });

    it('should filter by ownerId for regular USER', async () => {
      mockPrisma.garden.findMany.mockResolvedValue([{ id: 1, ownerId: 10 }]);

      await service.findAll({ id: 10, email: 'u@test.com', role: Role.USER });
      expect(mockPrisma.garden.findMany).toHaveBeenCalledWith({
        where: { ownerId: 10 },
        include: expect.any(Object),
      });
    });
  });
});