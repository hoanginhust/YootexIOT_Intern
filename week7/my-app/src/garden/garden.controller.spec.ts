import { Test, TestingModule } from '@nestjs/testing';
import { GardenController } from './garden.controller';
import { GardenService } from './garden.service';
import { AuthGuard } from '../auth/guard/auth.guard';

describe('GardenController', () => {
  let controller: GardenController;

  const gardenService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GardenController],
      providers: [{ provide: GardenService, useValue: gardenService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GardenController>(GardenController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should forward garden creation to service', async () => {
    gardenService.create.mockResolvedValue({ id: 1, name: 'A' });

    await expect(controller.create({ name: 'A' } as any, { id: 9, role: 'USER' } as any)).resolves.toEqual({
      id: 1,
      name: 'A',
    });
  });
});
