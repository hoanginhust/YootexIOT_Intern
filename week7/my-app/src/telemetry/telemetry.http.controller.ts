import { Controller, Post, Body, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeviceCommandDto } from './dto/device-command.dto';
import { AuthGuard } from '../auth/guard/auth.guard';

@ApiTags('Telemetry / Device Control')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('device')
export class TelemetryHttpController {
  constructor(
    @Inject('MQTT_SERVICE') private readonly mqttClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'Send light/LED control command to ESP32 via MQTT' })
  @ApiResponse({ status: 200, description: 'Command published to MQTT Broker.' })
  @Post('command')
  sendCommand(@Body() dto: DeviceCommandDto) {
    // Publish structured command payload to MQTT Topic 'esp32/commands'
    this.mqttClient.emit('esp32/commands', dto);

    return {
      message: 'Command successfully published to MQTT Broker',
      data: dto,
    };
  }
}