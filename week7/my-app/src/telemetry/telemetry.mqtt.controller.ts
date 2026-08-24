import { Controller, Logger, BadRequestException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TelemetryGateway } from './telemetry.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { SensorDataDto } from './dto/sensor-data.dto';

@Controller()
export class TelemetryMqttController {
  private logger = new Logger('TelemetryMqttController');

  // Safe thresholds for environment monitoring alerts
  private readonly TEMP_MAX = 38;
  private readonly HUMIDITY_MIN = 30;

  constructor(
    private readonly telemetryGateway: TelemetryGateway,
    private readonly prisma: PrismaService,
  ) {}

  // Subscribe to 'esp32/sensor_data' topic on MQTT Broker
  @MessagePattern('esp32/sensor_data')
  async handleSensorData(@Payload() data: SensorDataDto) {
    const targetGardenId = data.gardenId || data.id || 1;

    this.logger.log(
      `Received MQTT sensor payload for Garden ID ${targetGardenId}: Temp ${data.temperature}°C, Humidity ${data.humidity}%`,
    );

    try {
      const garden = await this.prisma.garden.findUnique({
        where: { id: targetGardenId },
      });

      if (!garden) {
        this.logger.warn(`Sensor data ignored: Garden ID ${targetGardenId} does not exist`);
        return;
      }

      // 1. Persist sensor telemetry to PostgreSQL SensorData table
      const savedRecord = await this.prisma.sensorData.create({
        data: {
          temperature: data.temperature,
          humidity: data.humidity,
          gardenId: targetGardenId,
        },
      });

      // 2. Broadcast complete packet real-time via WebSockets to connected clients
      this.telemetryGateway.broadcastTelemetry({
        ...data,
        gardenId: targetGardenId,
        dbId: savedRecord.id,
        recordedAt: savedRecord.recordedAt,
      });

      // 3. Trigger alert when environment metrics exceed safe thresholds
      this.checkThresholds(data.temperature, data.humidity, targetGardenId);
    } catch (error: any) {
      this.logger.error(`Failed to store sensor data to DB: ${error.message}`);
    }
  }

  private checkThresholds(temperature: number, humidity: number, gardenId: number) {
    const alerts: string[] = [];

    if (temperature > this.TEMP_MAX) {
      alerts.push(`Temperature ${temperature}°C exceeds safe limit ${this.TEMP_MAX}°C`);
    }
    if (humidity < this.HUMIDITY_MIN) {
      alerts.push(`Humidity ${humidity}% is below safe limit ${this.HUMIDITY_MIN}%`);
    }

    if (alerts.length > 0) {
      const message = alerts.join('; ');
      this.logger.warn(`[ALERT] Garden ${gardenId}: ${message}`);
      this.telemetryGateway.broadcastAlert({ gardenId, message, severity: 'critical' });
    }
  }
}
