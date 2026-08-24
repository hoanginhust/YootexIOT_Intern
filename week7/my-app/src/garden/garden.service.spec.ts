import { Test, TestingModule } from '@nestjs/testing';
import { GardenService } from './garden.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

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

  it('should throw when garden is missing', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue(null);

    await expect(service.findOne(1, { id: 1, role: 'USER' } as any)).rejects.toThrow(NotFoundException);
  });

  it('should deny access for non-owner user', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 2 });

    await expect(service.findOne(1, { id: 9, role: 'USER' } as any)).rejects.toThrow(ForbiddenException);
  });
});
