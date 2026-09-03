import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryGateway } from './telemetry.gateway';

describe('TelemetryGateway', () => {
  let gateway: TelemetryGateway;

  const mockServer = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetryGateway],
    }).compile();

    gateway = module.get<TelemetryGateway>(TelemetryGateway);
    gateway.server = mockServer as any;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should broadcast sensor telemetry data', () => {
    const data = { temperature: 28.0, humidity: 60.0 };
    gateway.broadcastTelemetry(data);
    expect(mockServer.emit).toHaveBeenCalledWith('sensor_data', data);
  });

  it('should broadcast critical alerts', () => {
    const alert = { message: 'High Temp Alert', severity: 'critical' };
    gateway.broadcastAlert(alert);
    expect(mockServer.emit).toHaveBeenCalledWith('critical_alert', alert);
  });
});