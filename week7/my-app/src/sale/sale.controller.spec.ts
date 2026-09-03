import { Test, TestingModule } from '@nestjs/testing';
import { SaleController } from './sale.controller';
import { SaleService } from './sale.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Role } from '@prisma/client';

describe('SaleController', () => {
  let controller: SaleController;

  const mockUser = { id: 1, email: 'test@example.com', role: Role.USER };

  const saleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleController],
      providers: [{ provide: SaleService, useValue: saleService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SaleController>(SaleController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a sale transaction', async () => {
    saleService.create.mockResolvedValue({ id: 1 });

    await expect(controller.create({ gardenId: 1, vegetableId: 1, quantity: 2 }, mockUser)).resolves.toEqual({
      id: 1,
    });
    expect(saleService.create).toHaveBeenCalledWith({ gardenId: 1, vegetableId: 1, quantity: 2 }, mockUser);
  });

  it('should list sales history', async () => {
    saleService.findAll.mockResolvedValue([{ id: 1, totalAmount: 50000 }]);

    await expect(controller.findAll(mockUser)).resolves.toEqual([{ id: 1, totalAmount: 50000 }]);
    expect(saleService.findAll).toHaveBeenCalledWith(mockUser);
  });
});