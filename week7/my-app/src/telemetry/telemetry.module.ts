import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelemetryGateway } from './telemetry.gateway';
import { TelemetryMqttController } from './telemetry.mqtt.controller';
import { TelemetryHttpController } from './telemetry.http.controller';
import { TelemetrySimulatorService } from './telemetry-simulator.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'MQTT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.MQTT,
          options: {
            url: config.get<string>('MQTT_URL') || 'mqtt://broker.hivemq.com:1883',
          },
        }),
      },
    ]),
  ],
  controllers: [TelemetryMqttController, TelemetryHttpController],
  providers: [TelemetryGateway, TelemetrySimulatorService],
})
export class TelemetryModule {}
