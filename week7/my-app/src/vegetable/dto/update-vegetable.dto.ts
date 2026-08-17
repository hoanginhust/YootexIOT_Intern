import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVegetableDto {
  @ApiPropertyOptional({ example: 150, description: 'Updated import quantity' })
  @IsInt()
  @Min(0)
  @IsOptional()
  importQty?: number;

  @ApiPropertyOptional({ example: 20, description: 'Updated sold quantity' })
  @IsInt()
  @Min(0)
  @IsOptional()
  soldQty?: number;
}