import { Controller, Post, Body, Inject, UseGuards, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
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
  @ApiOkResponse({ description: 'Command published to MQTT Broker.' })
  @ApiResponse({ status: 502, description: 'Failed to publish command to MQTT Broker.' })
  @HttpCode(HttpStatus.OK)
  @Post('command')
  async sendCommand(@Body() dto: DeviceCommandDto) {
    // Publish structured command payload to MQTT topic.
    try {
      await lastValueFrom(this.mqttClient.emit('esp32/commands', dto));

      return {
        message: 'Command successfully published to MQTT Broker',
        data: dto,
      };
    } catch (error: unknown) {
      throw new HttpException(
        'Failed to publish command to MQTT Broker',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
