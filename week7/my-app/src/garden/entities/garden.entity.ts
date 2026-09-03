import { ApiProperty } from '@nestjs/swagger';

export class GardenEntity {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Greenhouse Garden A' })
  name!: string;

  @ApiProperty({ example: 1 })
  ownerId!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}