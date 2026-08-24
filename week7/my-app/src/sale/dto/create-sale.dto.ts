import { IsInt, Min, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {
  @ApiProperty({ example: 1, description: 'ID of target garden' })
  @IsInt()
  @Min(1)
  gardenId!: number;

  @ApiProperty({ example: 1, description: 'ID of vegetable being sold' })
  @IsInt()
  @Min(1)
  vegetableId!: number;

  @ApiProperty({ example: 5, description: 'Quantity of vegetables sold' })
  @IsInt()
  @IsPositive()
  quantity!: number;
}
