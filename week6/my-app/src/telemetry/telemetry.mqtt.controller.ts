import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TelemetryGateway } from './telemetry.gateway';
import { SensorDataDto } from './dto/sensor-data.dto';

@Controller()
export class TelemetryMqttController {
  private logger = new Logger('TelemetryMqttController');

  constructor(private readonly telemetryGateway: TelemetryGateway) {}

  // Subscribe to 'esp32/sensor_data' topic on MQTT Broker
  @MessagePattern('esp32/sensor_data')
  handleSensorData(@Payload() data: SensorDataDto) {
    this.logger.log(`Received MQTT sensor packet #${data.packet_no} from Device ID ${data.id}`);
    
    // Push received MQTT packet directly to WebSocket clients
    this.telemetryGateway.broadcastTelemetry(data);
  }
}