import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryHttpController } from './telemetry.http.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/guard/auth.guard';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('TelemetryHttpController', () => {
  let controller: TelemetryHttpController;

  const mockMqttClient = {
    emit: jest.fn(),
  };

  const mockPrisma = {
    garden: {
      findUnique: jest.fn(),
    },
  };

  const mockUser = { id: 1, email: 'owner@test.com', role: Role.USER };
  const mockAdmin = { id: 99, email: 'admin@test.com', role: Role.ADMIN };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryHttpController],
      providers: [
        { provide: 'MQTT_SERVICE', useValue: mockMqttClient },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TelemetryHttpController>(TelemetryHttpController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw NotFoundException if target garden does not exist', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue(null);

    await expect(
      controller.sendCommand({ gardenId: 999, userId: 1, led1State: 'On' }, mockUser),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if regular user sends command to another garden', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 2 });

    await expect(
      controller.sendCommand({ gardenId: 1, userId: 1, led1State: 'On' }, mockUser),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user tampers userId', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });

    await expect(
      controller.sendCommand({ gardenId: 1, userId: 2, led1State: 'On' }, mockUser),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should publish command to MQTT broker when valid', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 1 });

    const dto = { gardenId: 1, userId: 1, ledRedState: 'On' as const };
    const response = await controller.sendCommand(dto, mockUser);

    expect(response).toEqual({
      message: 'Command successfully published to MQTT Broker',
      data: dto,
    });
    expect(mockMqttClient.emit).toHaveBeenCalledWith('esp32/commands', dto);
  });

  it('should allow ADMIN to publish command to any garden', async () => {
    mockPrisma.garden.findUnique.mockResolvedValue({ id: 1, ownerId: 5 });

    const dto = { gardenId: 1, userId: 99, ledGreenState: 'Off' as const };
    const response = await controller.sendCommand(dto, mockAdmin);

    expect(response.data).toEqual(dto);
    expect(mockMqttClient.emit).toHaveBeenCalledWith('esp32/commands', dto);
  });
});