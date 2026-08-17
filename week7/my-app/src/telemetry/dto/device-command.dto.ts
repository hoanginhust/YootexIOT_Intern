import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeviceCommandDto {
  @ApiProperty({ example: '1', description: 'Target Garden ID' })
  @IsString()
  @IsNotEmpty()
  garderID!: string;

  @ApiProperty({ example: '1', description: 'User ID issuing the command' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ example: 'On', description: 'LED 1 state: On or Off', enum: ['On', 'Off'] })
  @IsString()
  @IsIn(['On', 'Off'])
  led1State!: string;
}