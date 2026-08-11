import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SensorDataDto {
  @ApiProperty({ example: 11 })
  @IsNumber()
  @IsNotEmpty()
  id!: number;

  @ApiProperty({ example: 126 })
  @IsNumber()
  @IsNotEmpty()
  packet_no!: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  temperature!: number;

  @ApiProperty({ example: 60 })
  @IsNumber()
  humidity!: number;

  @ApiProperty({ example: 1100 })
  @IsNumber()
  tds!: number;

  @ApiProperty({ example: 5.0 })
  @IsNumber()
  pH!: number;
}