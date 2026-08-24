import { Test, TestingModule } from '@nestjs/testing';
import { SaleController } from './sale.controller';
import { SaleService } from './sale.service';

describe('SaleController', () => {
  let controller: SaleController;

  const saleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SaleController],
      providers: [{ provide: SaleService, useValue: saleService }],
    }).compile();

    controller = module.get<SaleController>(SaleController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a sale', async () => {
    saleService.create.mockResolvedValue({ id: 1 });

    await expect(controller.create({ gardenId: 1, vegetableId: 1, quantity: 2 } as any, { id: 1 } as any)).resolves.toEqual({
      id: 1,
    });
  });
});
