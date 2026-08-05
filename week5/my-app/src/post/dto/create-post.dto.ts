import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ example: 'My First Post', description: 'Title of the post' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'This is the content body of my post.', description: 'Optional post content body' })
  @IsString()
  @IsOptional()
  content?: string;
}