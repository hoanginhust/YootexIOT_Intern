import { ApiProperty } from '@nestjs/swagger';

export class VegetableEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Tomato' })
  name!: string;

  @ApiProperty({ example: 100 })
  importQty!: number;

  @ApiProperty({ example: 20 })
  soldQty!: number;

  @ApiProperty({ example: 1 })
  gardenId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}