import { IsInt, Min, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceCommandDto {
  @ApiProperty({ example: 1, description: 'Target Garden ID' })
  @IsInt()
  @Min(1)
  gardenId!: number;

  @ApiProperty({ example: 1, description: 'User ID issuing the command' })
  @IsInt()
  @Min(1)
  userId!: number;

  // Operating mode toggle: Auto (sensor thresholds) or Manual (remote override)
  @ApiPropertyOptional({
    example: 'Manual',
    description: 'Operating mode: Auto or Manual',
    enum: ['Auto', 'Manual'],
  })
  @IsOptional()
  @IsIn(['Auto', 'Manual'])
  mode?: 'Auto' | 'Manual';

  // Backward compatible legacy LED state
  @ApiPropertyOptional({
    example: 'On',
    description: 'LED 1 state: On or Off (backward compatible)',
    enum: ['On', 'Off'],
  })
  @IsOptional()
  @IsIn(['On', 'Off'])
  led1State?: 'On' | 'Off';

  // Critical danger indicator (Temp > 38°C or Hum < 30%)
  @ApiPropertyOptional({
    example: 'On',
    description: 'Red LED state: On or Off',
    enum: ['On', 'Off'],
  })
  @IsOptional()
  @IsIn(['On', 'Off'])
  ledRedState?: 'On' | 'Off';

  // Early warning indicator (Temp 32°C - 38°C)
  @ApiPropertyOptional({
    example: 'Off',
    description: 'Yellow LED state: On or Off',
    enum: ['On', 'Off'],
  })
  @IsOptional()
  @IsIn(['On', 'Off'])
  ledYellowState?: 'On' | 'Off';

  // Safe condition indicator (Temp <= 32°C and Hum >= 30%)
  @ApiPropertyOptional({
    example: 'On',
    description: 'Green LED state: On or Off',
    enum: ['On', 'Off'],
  })
  @IsOptional()
  @IsIn(['On', 'Off'])
  ledGreenState?: 'On' | 'Off';
}