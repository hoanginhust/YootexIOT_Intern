import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call register service', async () => {
    authService.register.mockResolvedValue({ id: 1 });

    await expect(controller.register({ name: 'A', email: 'a@example.com', password: '123456' } as any)).resolves.toEqual({ id: 1 });
  });
});
