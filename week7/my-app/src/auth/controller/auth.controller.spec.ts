import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../service/auth.service';

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

  it('should call register service with valid payload', async () => {
    const registerDto = { name: 'Nguyen Van A', email: 'a@example.com', password: 'password123' };
    authService.register.mockResolvedValue({ id: 1, ...registerDto });

    await expect(controller.register(registerDto)).resolves.toEqual({ id: 1, ...registerDto });
    expect(authService.register).toHaveBeenCalledWith(registerDto);
  });

  it('should call login service and return access token', async () => {
    const loginDto = { email: 'a@example.com', password: 'password123' };
    authService.login.mockResolvedValue({ access_token: 'mocked_jwt_token' });

    await expect(controller.login(loginDto)).resolves.toEqual({ access_token: 'mocked_jwt_token' });
    expect(authService.login).toHaveBeenCalledWith(loginDto);
  });
});