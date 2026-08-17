import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVegetableDto {
  @ApiProperty({ example: 'Tomato', description: 'Name of the vegetable' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 100, description: 'Initial import quantity' })
  @IsInt()
  @Min(0)
  importQty!: number;

  @ApiProperty({ example: 1, description: 'ID of target garden' })
  @IsInt()
  gardenId!: number;
}