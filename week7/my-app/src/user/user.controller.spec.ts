import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '@prisma/client';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = { id: 1, email: 'u@test.com', role: Role.USER };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll', async () => {
    mockUserService.findAll.mockResolvedValue([{ id: 1 }]);
    await expect(controller.findAll()).resolves.toEqual([{ id: 1 }]);
  });

  it('should call update for current user', async () => {
    mockUserService.update.mockResolvedValue({ id: 1, name: 'Updated' });
    await expect(controller.update(1, { name: 'Updated' })).resolves.toEqual({ id: 1, name: 'Updated' });
    expect(mockUserService.update).toHaveBeenCalledWith(1, { name: 'Updated' });
  });
});