import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A', description: 'Updated display name for the user' })
  @IsString()
  @IsOptional()
  name?: string;
}