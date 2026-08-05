import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Software engineering student passionate about NestJS', description: 'User biography' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png', description: 'Avatar image URL' })
  @IsString()
  @IsOptional()
  avatar?: string;
}