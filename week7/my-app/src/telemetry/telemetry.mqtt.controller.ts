import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TelemetryGateway } from './telemetry.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { SensorDataDto } from './dto/sensor-data.dto';

@Controller()
export class TelemetryMqttController {
  private readonly logger = new Logger(TelemetryMqttController.name);

  // Thresholds matching report standards
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

    // Validate essential numerical values before processing
    if (typeof data.temperature !== 'number' || typeof data.humidity !== 'number') {
      this.logger.warn(`Malformed sensor packet dropped: ${JSON.stringify(data)}`);
      return;
    }

    this.logger.log(
      `Received MQTT packet for Garden #${targetGardenId}: ${data.temperature}°C, ${data.humidity}%`,
    );

    try {
      const garden = await this.prisma.garden.findUnique({
        where: { id: targetGardenId },
      });

      if (!garden) {
        this.logger.warn(`Ignored packet: Garden #${targetGardenId} does not exist in DB.`);
        return;
      }

      // 1. Persist sensor telemetry to PostgreSQL
      const savedRecord = await this.prisma.sensorData.create({
        data: {
          temperature: data.temperature,
          humidity: data.humidity,
          gardenId: targetGardenId,
        },
      });

      // 2. Broadcast complete telemetry via WebSocket
      this.telemetryGateway.broadcastTelemetry({
        ...data,
        gardenId: targetGardenId,
        dbId: savedRecord.id,
        recordedAt: savedRecord.recordedAt,
      });

      // 3. Trigger alert when environment conditions exceed safety limits
      this.checkThresholds(data.temperature, data.humidity, targetGardenId);
    } catch (error: any) {
      this.logger.error(`Failed to persist sensor data: ${error.message}`);
    }
  }

  private checkThresholds(temperature: number, humidity: number, gardenId: number) {
    const alerts: string[] = [];

    if (temperature > this.TEMP_MAX) {
      alerts.push(`High temperature detected: ${temperature}°C (> ${this.TEMP_MAX}°C)`);
    }
    if (humidity < this.HUMIDITY_MIN) {
      alerts.push(`Low humidity detected: ${humidity}% (< ${this.HUMIDITY_MIN}%)`);
    }

    if (alerts.length > 0) {
      const alertPayload = {
        gardenId,
        temperature,
        humidity,
        message: alerts.join('; '),
        severity: 'critical',
        timestamp: new Date().toISOString(),
      };

      this.logger.warn(`[ALERT] Garden #${gardenId}: ${alertPayload.message}`);
      this.telemetryGateway.broadcastAlert(alertPayload);
    }
  }
}