import { Test, TestingModule } from '@nestjs/testing';
import { PriceService } from './price.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

describe('PriceService', () => {
  let service: PriceService;

  const mockUser = { id: 1, email: 'user@test.com', role: Role.USER };
  const mockAdmin = { id: 99, email: 'admin@test.com', role: Role.ADMIN };

  const mockPrisma = {
    vegetablePrice: {
      findMany: jest.fn(),
    },
    sale: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PriceService>(PriceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTotalRevenueByPeriod', () => {
    it('should aggregate revenue for USER gardens only', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { totalAmount: 500000 },
        _count: { id: 10 },
      });
      mockPrisma.sale.groupBy.mockResolvedValue([
        { vegetableId: 1, _sum: { totalAmount: 500000, quantity: 20 } },
      ]);

      const result = await service.getTotalRevenueByPeriod('day', mockUser);

      expect(result.totalRevenue).toBe(500000);
      expect(result.totalTransactions).toBe(10);
      expect(mockPrisma.sale.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            garden: { ownerId: 1 },
          }),
        }),
      );
    });

    it('should aggregate revenue system-wide for ADMIN', async () => {
      mockPrisma.sale.aggregate.mockResolvedValue({
        _sum: { totalAmount: 2500000 },
        _count: { id: 50 },
      });
      mockPrisma.sale.groupBy.mockResolvedValue([]);

      const result = await service.getTotalRevenueByPeriod('month', mockAdmin);

      expect(result.totalRevenue).toBe(2500000);
      expect(mockPrisma.sale.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            garden: { ownerId: expect.anything() },
          }),
        }),
      );
    });
  });

  describe('getPricesByPeriod', () => {
    it('should fetch prices for owner gardens', async () => {
      mockPrisma.vegetablePrice.findMany.mockResolvedValue([{ id: 1, price: 20000 }]);

      const res = await service.getPricesByPeriod('week', mockUser);
      expect(res).toEqual([{ id: 1, price: 20000 }]);
      expect(mockPrisma.vegetablePrice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vegetable: { garden: { ownerId: 1 } },
          }),
        }),
      );
    });
  });
});