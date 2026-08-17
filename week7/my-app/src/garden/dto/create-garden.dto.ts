import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGardenDto {
  @ApiProperty({ example: 'Greenhouse Garden A', description: 'Name of the garden' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}