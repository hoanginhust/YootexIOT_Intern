import { Test, TestingModule } from '@nestjs/testing';
import { SaleService } from './sale.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SaleService', () => {
  let service: SaleService;

  const mockTx = {
    vegetable: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sale: {
      create: jest.fn(),
    },
    vegetablePrice: {
      findMany: jest.fn(),
    },
  };

  const mockPrisma = {
    $transaction: jest.fn((cb) => cb(mockTx)),
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

  it('should throw when vegetable not found', async () => {
    mockTx.vegetable.findUnique.mockResolvedValue(null);

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 })).rejects.toThrow(NotFoundException);
  });

  it('should throw when gardenId mismatch', async () => {
    mockTx.vegetable.findUnique.mockResolvedValue({
      id: 1,
      gardenId: 2,
      importQty: 100,
      soldQty: 0,
      prices: [{ price: 10000 }],
    });

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 })).rejects.toThrow(BadRequestException);
  });

  it('should throw when insufficient stock', async () => {
    mockTx.vegetable.findUnique.mockResolvedValue({
      id: 1,
      gardenId: 1,
      importQty: 10,
      soldQty: 9,
      prices: [{ price: 10000 }],
    });

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 })).rejects.toThrow(BadRequestException);
  });

  it('should throw when no price set', async () => {
    mockTx.vegetable.findUnique.mockResolvedValue({
      id: 1,
      gardenId: 1,
      importQty: 100,
      soldQty: 0,
      prices: [],
    });

    await expect(service.create({ gardenId: 1, vegetableId: 1, quantity: 2 })).rejects.toThrow(BadRequestException);
  });
});
