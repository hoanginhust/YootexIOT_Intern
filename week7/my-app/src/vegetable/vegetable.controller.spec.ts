import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VegetableController } from './vegetable.controller';
import { VegetableService } from './vegetable.service';

describe('VegetableController', () => {
  let controller: VegetableController;
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
    }).compile();

    controller = module.get<VegetableController>(VegetableController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a vegetable in the given garden', async () => {
    vegetableService.create.mockResolvedValue({ id: 1, name: 'Tomato', gardenId: 2 });

    await expect(controller.create(2, { name: 'Tomato', importQty: 100, gardenId: 1 } as any)).resolves.toEqual({
      id: 1,
      name: 'Tomato',
      gardenId: 2,
    });

    expect(vegetableService.create).toHaveBeenCalledWith({ name: 'Tomato', importQty: 100, gardenId: 2 });
  });

  it('should route vegetable list by garden id', async () => {
    vegetableService.findAll.mockResolvedValue([{ id: 1 }]);

    await expect(controller.findAll(3)).resolves.toEqual([{ id: 1 }]);
    expect(vegetableService.findAll).toHaveBeenCalledWith(3);
  });
});
