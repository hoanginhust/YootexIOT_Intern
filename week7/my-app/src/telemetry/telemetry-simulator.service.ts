import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { TelemetryGateway } from './telemetry.gateway';

@Injectable()
export class TelemetrySimulatorService {
  private readonly logger = new Logger('TelemetrySimulator');
  private packetNo = 1;

  constructor(private readonly telemetryGateway: TelemetryGateway) {}

  // Automatically generates and broadcasts random sensor data
  // Note: Comment out @Interval when testing manual MQTT publishing via MQTTX
  // @Interval(1000)
  generateRandomSensorData() {
    const mockData = {
      gardenId: 1,
      id: 11,
      packet_no: this.packetNo++,
      temperature: Number((20 + Math.random() * 15).toFixed(1)), // 20 - 35°C
      humidity: Number((40 + Math.random() * 40).toFixed(1)),    // 40 - 80%
      tds: Math.floor(500 + Math.random() * 1000),               // 500 - 1500 ppm
      pH: Number((5.5 + Math.random() * 3).toFixed(1)),          // 5.5 - 8.5 pH
    };

    this.telemetryGateway.broadcastTelemetry(mockData);
    this.logger.log(`Broadcasted real-time packet #${mockData.packet_no}`);
  }
}