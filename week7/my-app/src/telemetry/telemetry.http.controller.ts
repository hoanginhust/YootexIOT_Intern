import { Controller, Post, Body, Inject, UseGuards, HttpException, HttpStatus, HttpCode, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { DeviceCommandDto } from './dto/device-command.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { ActiveUserData } from '../auth/interface/active-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@ApiTags('Telemetry / Device Control')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('device')
export class TelemetryHttpController {
  constructor(
    @Inject('MQTT_SERVICE') private readonly mqttClient: ClientProxy,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'Send light/LED control command to ESP32 via MQTT' })
  @ApiOkResponse({ description: 'Command published to MQTT Broker.' })
  @ApiResponse({ status: 400, description: 'Invalid command data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your garden or userId mismatch.' })
  @ApiResponse({ status: 404, description: 'Garden not found.' })
  @ApiResponse({ status: 502, description: 'Failed to publish command to MQTT Broker.' })
  @HttpCode(HttpStatus.OK)
  @Post('command')
  async sendCommand(@Body() dto: DeviceCommandDto, @CurrentUser() user: ActiveUserData) {
    // Ensure target garden exists and belongs to the caller (ADMIN bypasses)
    const garden = await this.prisma.garden.findUnique({ where: { id: dto.gardenId } });
    if (!garden) throw new NotFoundException(`Garden with ID ${dto.gardenId} not found.`);

    if (user.role !== Role.ADMIN) {
      if (garden.ownerId !== user.id) {
        throw new ForbiddenException('You do not have access to this garden.');
      }
      // Prevent spoofing another user ID
      if (dto.userId !== user.id) {
        throw new ForbiddenException('userId must match the authenticated user.');
      }
    }

    try {
      // Fire-and-forget emit pattern suitable for MQTT QoS 0/1 command event
      this.mqttClient.emit('esp32/commands', dto);

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