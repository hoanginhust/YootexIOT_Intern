import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryMqttController } from './telemetry.mqtt.controller';
import { TelemetryHttpController } from './telemetry.http.controller';
import { TelemetrySimulatorService } from './telemetry-simulator.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      {
        name: 'MQTT_SERVICE',
        transport: Transport.MQTT,
        options: {
          url: 'mqtt://broker.hivemq.com:1883',
        },
      },
    ]),
  ],
  controllers: [TelemetryMqttController, TelemetryHttpController],
  providers: [TelemetryGateway, TelemetrySimulatorService],
})
export class TelemetryModule {}