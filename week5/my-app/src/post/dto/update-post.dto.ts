import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Updated Post Title', description: 'New title for the post' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated post content body.', description: 'New content body for the post' })
  @IsString()
  @IsOptional()
  content?: string;
}