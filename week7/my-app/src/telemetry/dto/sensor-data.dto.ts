import { IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SensorDataDto {
  @ApiProperty({ example: 1, description: 'Garden ID associated with sensor' })
  @IsNumber()
  @IsNotEmpty()
  gardenId!: number;

  @ApiPropertyOptional({ example: 11 })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiPropertyOptional({ example: 126 })
  @IsNumber()
  @IsOptional()
  packet_no?: number;

  @ApiProperty({ example: 28.5, description: 'Environment temperature (°C)' })
  @IsNumber()
  temperature!: number;

  @ApiProperty({ example: 65.0, description: 'Environment humidity (%)' })
  @IsNumber()
  humidity!: number;

  @ApiPropertyOptional({ example: 1100 })
  @IsNumber()
  @IsOptional()
  tds?: number;

  @ApiPropertyOptional({ example: 6.5 })
  @IsNumber()
  @IsOptional()
  pH?: number;
}