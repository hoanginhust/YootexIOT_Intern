import { IsInt, IsNotEmpty, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceCommandDto {
  @ApiProperty({ example: 1, description: 'Target Garden ID' })
  @IsInt()
  @Min(1)
  gardenId!: number;

  @ApiProperty({ example: 1, description: 'User ID issuing the command' })
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({ example: 'On', description: 'LED 1 state: On or Off', enum: ['On', 'Off'] })
  @IsIn(['On', 'Off'])
  led1State!: 'On' | 'Off';
}
