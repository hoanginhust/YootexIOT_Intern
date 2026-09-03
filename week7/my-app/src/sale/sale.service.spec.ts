import { Test, TestingModule } from '@nestjs/testing';
import { SaleService } from './sale.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('SaleService', () => {
  let service: SaleService;

  const mockUser = { id: 1, email: 'owner@example.com', role: Role.USER };
  const mockAdmin = { id: 2, email: 'admin@example.com', role: Role.ADMIN };

  const mockTx = {
    vegetable: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sale: {
      create: jest.fn(),
    },
  };

  const mockPrisma = {
    $transaction: jest.fn((cb) => cb(mockTx)),
    garden: {
      findUnique: jest.fn(),
    },
    sale: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SaleService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SaleService>(SaleService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ForbiddenException when selling in another user garden', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 99 });

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 }, mockUser)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException even for ADMIN when selling in another user garden', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 99 });

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 }, mockAdmin)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw when vegetable not found', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    mockTx.vegetable.findUnique.mockResolvedValue(null);

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 }, mockUser)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw when vegetable does not belong to garden', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    mockTx.vegetable.findUnique.mockResolvedValue({
      id: 1,
      gardenId: 2,
      importQty: 100,
      soldQty: 0,
      prices: [{ price: 10000 }],
    });

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 }, mockUser)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when insufficient stock', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    mockTx.vegetable.findUnique.mockResolvedValue({
      id: 1,
      gardenId: 1,
      importQty: 10,
      soldQty: 9,
      prices: [{ price: 10000 }],
    });

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 }, mockUser)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when vegetable has no price set', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    mockTx.vegetable.findUnique.mockResolvedValue({
      id: 1,
      gardenId: 1,
      importQty: 100,
      soldQty: 0,
      prices: [],
    });

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 }, mockUser)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should successfully process sale and update soldQty', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    mockTx.vegetable.findUnique.mockResolvedValue({
      id: 1,
      gardenId: 1,
      importQty: 100,
      soldQty: 10,
      prices: [{ price: 20000 }],
    });
    mockTx.sale.create.mockResolvedValue({
      id: 101,
      quantity: 5,
      totalAmount: 100000,
      gardenId: 1,
      vegetableId: 1,
    });

    const result = await service.create({ gardenId: 1, vegetableId: 1, quantity: 5 }, mockUser);

    expect(result.id).toBe(101);
    expect(mockTx.vegetable.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { soldQty: 15 },
    });
    expect(mockTx.sale.create).toHaveBeenCalledWith({
      data: {
        quantity: 5,
        totalAmount: 100000,
        gardenId: 1,
        vegetableId: 1,
      },
      include: expect.any(Object),
    });
  });
});