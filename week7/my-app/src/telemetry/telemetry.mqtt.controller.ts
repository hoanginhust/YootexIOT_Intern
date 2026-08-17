import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TelemetryGateway } from './telemetry.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { SensorDataDto } from './dto/sensor-data.dto';

@Controller()
export class TelemetryMqttController {
  private logger = new Logger('TelemetryMqttController');

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
    } catch (error: any) {
      this.logger.error(`Failed to store sensor data to DB: ${error.message}`);
    }
  }
}