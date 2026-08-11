import { Controller, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Telemetry / Device Control')
@Controller('device')
export class TelemetryHttpController {
  constructor(
    @Inject('MQTT_SERVICE') private readonly mqttClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'Send control command to ESP32 device via MQTT' })
  @ApiResponse({ status: 200, description: 'Command published to MQTT Broker.' })
  @Post('command')
  sendCommand(@Body() commandPayload: { deviceId: number; command: string }) {
    // Publish message down to MQTT Topic 'esp32/commands'
    this.mqttClient.emit('esp32/commands', commandPayload);
    return {
      message: 'Command successfully published to MQTT Broker',
      payload: commandPayload,
    };
  }
}