import { Test, TestingModule } from '@nestjs/testing';
import { GardenController } from './garden.controller';
import { GardenService } from './garden.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Role } from '@prisma/client';

describe('GardenController', () => {
  let controller: GardenController;

  const mockUser = { id: 9, email: 'user@test.com', role: Role.USER };

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

    await expect(controller.create({ name: 'A' }, mockUser)).resolves.toEqual({
      id: 1,
      name: 'A',
    });
    expect(gardenService.create).toHaveBeenCalledWith({ name: 'A' }, mockUser);
  });

  it('should retrieve garden details by ID', async () => {
    gardenService.findOne.mockResolvedValue({ id: 1, name: 'Garden A' });

    await expect(controller.findOne(1, mockUser)).resolves.toEqual({ id: 1, name: 'Garden A' });
    expect(gardenService.findOne).toHaveBeenCalledWith(1, mockUser);
  });

  it('should delete garden', async () => {
    gardenService.remove.mockResolvedValue({ message: 'Successfully deleted garden with ID 1' });

    await expect(controller.remove(1, mockUser)).resolves.toEqual({
      message: 'Successfully deleted garden with ID 1',
    });
    expect(gardenService.remove).toHaveBeenCalledWith(1, mockUser);
  });
});