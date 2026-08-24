import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VegetableService } from './vegetable.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VegetableService', () => {
  let service: VegetableService;

  const mockPrisma = {
    garden: {
      findUnique: jest.fn(),
    },
    vegetable: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    vegetablePrice: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VegetableService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VegetableService>(VegetableService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a vegetable with default soldQty', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.vegetable.create.mockResolvedValue({ id: 10, soldQty: 0 });

    const result = await service.create({ name: 'Tomato', importQty: 100, gardenId: 1 });

    expect(result).toEqual({ id: 10, soldQty: 0 });
    expect(mockPrisma.vegetable.create).toHaveBeenCalledWith({
      data: { name: 'Tomato', importQty: 100, soldQty: 0, gardenId: 1 },
    });
  });

  it('should throw when garden does not exist', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue(null);

    await expect(service.create({ name: 'Tomato', importQty: 100, gardenId: 1 })).rejects.toThrow(NotFoundException);
  });

  it('should update vegetable only when quantities are valid', async () => {
    mockPrisma.vegetable.findFirst.mockResolvedValue({
      id: 5,
      name: 'Tomato',
      importQty: 100,
      soldQty: 10,
      gardenId: 1,
    });
    mockPrisma.vegetable.update.mockResolvedValue({ id: 5, name: 'Tomato', importQty: 120, soldQty: 20 });

    const result = await service.update(1, 5, { importQty: 120, soldQty: 20 });

    expect(result).toEqual({ id: 5, name: 'Tomato', importQty: 120, soldQty: 20 });
  });

  it('should throw when soldQty exceeds importQty', async () => {
    mockPrisma.vegetable.findFirst.mockResolvedValue({
      id: 5,
      name: 'Tomato',
      importQty: 100,
      soldQty: 10,
      gardenId: 1,
    });

    await expect(service.update(1, 5, { importQty: 20, soldQty: 30 })).rejects.toThrow(BadRequestException);
  });
});
