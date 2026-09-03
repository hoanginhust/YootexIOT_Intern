import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { VegetableService } from './vegetable.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VegetableService', () => {
  let service: VegetableService;

  const mockUser = { id: 1, email: 'owner@example.com', role: 'USER' };
  const mockAdmin = { id: 2, email: 'admin@example.com', role: 'ADMIN' };

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
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    mockPrisma.vegetable.create.mockResolvedValue({ id: 10, soldQty: 0 });

    const result = await service.create(1, { name: 'Tomato', importQty: 100 }, mockUser);

    expect(result).toEqual({ id: 10, soldQty: 0 });
    expect(mockPrisma.vegetable.create).toHaveBeenCalledWith({
      data: { name: 'Tomato', importQty: 100, soldQty: 0, gardenId: 1 },
    });
  });

  it('should throw when garden does not exist', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue(null);

    await expect(service.create(1, { name: 'Tomato', importQty: 100 }, mockUser)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when creating vegetable in another user garden', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 99 });

    await expect(service.create(1, { name: 'Tomato', importQty: 100 }, mockUser)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException even for ADMIN when adding vegetable to another user garden', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 99 });

    await expect(service.create(1, { name: 'Tomato', importQty: 100 }, mockAdmin)).rejects.toThrow(ForbiddenException);
  });

  it('should allow admin to create a vegetable in their own garden', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 5, ownerId: 2 });
    mockPrisma.vegetable.create.mockResolvedValue({ id: 20, soldQty: 0 });

    const result = await service.create(5, { name: 'Lettuce', importQty: 50 }, mockAdmin);

    expect(result).toEqual({ id: 20, soldQty: 0 });
  });

  it('should allow admin to read vegetables of any garden (monitoring)', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 99 });
    mockPrisma.vegetable.findMany.mockResolvedValue([{ id: 1, name: 'Tomato' }]);

    const result = await service.findAll(1, mockAdmin);

    expect(result).toEqual([{ id: 1, name: 'Tomato' }]);
  });

  it('should update vegetable only when quantities are valid', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    mockPrisma.vegetable.findFirst.mockResolvedValue({
      id: 5,
      name: 'Tomato',
      importQty: 100,
      soldQty: 10,
      gardenId: 1,
    });
    mockPrisma.vegetable.update.mockResolvedValue({ id: 5, name: 'Tomato', importQty: 120, soldQty: 20 });

    const result = await service.update(1, 5, { importQty: 120, soldQty: 20 }, mockUser);

    expect(result).toEqual({ id: 5, name: 'Tomato', importQty: 120, soldQty: 20 });
  });

  it('should throw when soldQty exceeds importQty', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    mockPrisma.vegetable.findFirst.mockResolvedValue({
      id: 5,
      name: 'Tomato',
      importQty: 100,
      soldQty: 10,
      gardenId: 1,
    });

    await expect(service.update(1, 5, { importQty: 20, soldQty: 30 }, mockUser)).rejects.toThrow(BadRequestException);
  });
});
