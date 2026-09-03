import { Test, TestingModule } from '@nestjs/testing';
import { VegetableController } from './vegetable.controller';
import { VegetableService } from './vegetable.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Role } from '@prisma/client';

describe('VegetableController', () => {
  let controller: VegetableController;
  const mockUser = { id: 1, email: 'test@example.com', role: Role.USER };

  const vegetableService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    setPrice: jest.fn(),
    updatePrice: jest.fn(),
    getPrice: jest.fn(),
    deletePrice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VegetableController],
      providers: [{ provide: VegetableService, useValue: vegetableService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<VegetableController>(VegetableController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a vegetable in the given garden', async () => {
    vegetableService.create.mockResolvedValue({ id: 1, name: 'Tomato', gardenId: 2 });

    await expect(controller.create(2, { name: 'Tomato', importQty: 100 }, mockUser)).resolves.toEqual({
      id: 1,
      name: 'Tomato',
      gardenId: 2,
    });
    expect(vegetableService.create).toHaveBeenCalledWith(2, { name: 'Tomato', importQty: 100 }, mockUser);
  });

  it('should update price record', async () => {
    vegetableService.updatePrice.mockResolvedValue({ id: 10, price: 30000 });

    await expect(controller.updatePrice(1, 5, { price: 30000 }, mockUser)).resolves.toEqual({
      id: 10,
      price: 30000,
    });
    expect(vegetableService.updatePrice).toHaveBeenCalledWith(1, 5, { price: 30000 }, mockUser);
  });

  it('should get price history', async () => {
    vegetableService.getPrice.mockResolvedValue([{ id: 1, price: 25000 }]);

    await expect(controller.getPrice(1, 5, mockUser)).resolves.toEqual([{ id: 1, price: 25000 }]);
    expect(vegetableService.getPrice).toHaveBeenCalledWith(1, 5, mockUser);
  });
});