import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPriceDto {
  @ApiProperty({ example: 25000, description: 'Selling price per unit' })
  @IsNumber()
  @IsPositive()
  price!: number;
}
