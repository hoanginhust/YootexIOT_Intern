import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  // Protected: Only authenticated users can create posts
  @UseGuards(AuthGuard)
  @Post()
  create(@Request() req: any, @Body() dto: CreatePostDto) {
    const userId = req.user.id; // Extract user id from JWT payload
    return this.postService.create(userId, dto);
  }

  // Public: View all posts or filter them by ?userId=number
  @Get()
  findAll(@Query('userId') userId?: string) {
    return this.postService.findAll(userId ? +userId : undefined);
  }

  // Public: Everyone can view a single post
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  // Protected: Requires ADMIN or post Owner validation
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto, @Request() req: any) {
    return this.postService.update(+id, dto, req.user);
  }

  // Protected: Requires ADMIN or post Owner validation
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.postService.remove(+id, req.user);
  }
}