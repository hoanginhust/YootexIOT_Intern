import { IsInt, IsNotEmpty, Min, IsIn, IsOptional } from 'class-validator';
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

  @ApiProperty({ example: 'On', description: 'LED 1 state: On or Off (backward compatible)', enum: ['On', 'Off'] })
  @IsOptional()
  @IsIn(['On', 'Off'])
  led1State?: 'On' | 'Off';

  @ApiPropertyOptional({ example: 'On', description: 'Red LED state: On or Off', enum: ['On', 'Off'] })
  @IsOptional()
  @IsIn(['On', 'Off'])
  ledRedState?: 'On' | 'Off';

  @ApiPropertyOptional({ example: 'Off', description: 'Yellow LED state: On or Off', enum: ['On', 'Off'] })
  @IsOptional()
  @IsIn(['On', 'Off'])
  ledYellowState?: 'On' | 'Off';

  @ApiPropertyOptional({ example: 'On', description: 'Green LED state: On or Off', enum: ['On', 'Off'] })
  @IsOptional()
  @IsIn(['On', 'Off'])
  ledGreenState?: 'On' | 'Off';
}
