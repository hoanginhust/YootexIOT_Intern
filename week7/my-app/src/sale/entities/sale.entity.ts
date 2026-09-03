import { ApiProperty } from '@nestjs/swagger';

export class SaleEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 5 })
  quantity!: number;

  @ApiProperty({ example: 125000 })
  totalAmount!: number;

  @ApiProperty()
  soldAt!: Date;

  @ApiProperty({ example: 1 })
  gardenId!: number;

  @ApiProperty({ example: 1 })
  vegetableId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}