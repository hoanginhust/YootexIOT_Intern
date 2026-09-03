import { Test, TestingModule } from '@nestjs/testing';
import { PriceController } from './price.controller';
import { PriceService } from './price.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Role } from '@prisma/client';

describe('PriceController', () => {
  let controller: PriceController;
  const mockUser = { id: 1, email: 'u@test.com', role: Role.USER };

  const mockPriceService = {
    getPricesByPeriod: jest.fn(),
    getTotalRevenueByPeriod: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceController],
      providers: [{ provide: PriceService, useValue: mockPriceService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PriceController>(PriceController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should route getPrices query to service', async () => {
    mockPriceService.getPricesByPeriod.mockResolvedValue([]);
    await expect(controller.getPrices({ period: 'week' }, mockUser)).resolves.toEqual([]);
    expect(mockPriceService.getPricesByPeriod).toHaveBeenCalledWith('week', mockUser);
  });

  it('should route getTotalRevenue query to service', async () => {
    mockPriceService.getTotalRevenueByPeriod.mockResolvedValue({ totalRevenue: 1000 });
    await expect(controller.getTotalRevenue({ period: 'day' }, mockUser)).resolves.toEqual({
      totalRevenue: 1000,
    });
    expect(mockPriceService.getTotalRevenueByPeriod).toHaveBeenCalledWith('day', mockUser);
  });
});