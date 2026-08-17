import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {
  @ApiProperty({ example: 1, description: 'ID of target garden' })
  @IsInt()
  gardenId!: number;

  @ApiProperty({ example: 1, description: 'ID of vegetable being sold' })
  @IsInt()
  vegetableId!: number;

  @ApiProperty({ example: 5, description: 'Quantity of vegetables sold' })
  @IsInt()
  @Min(1)
  quantity!: number;
}