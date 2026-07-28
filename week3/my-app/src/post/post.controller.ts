import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { PostService } from './post.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('posts')
@UseGuards(AuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  // Access user object verified data directly injected from AuthGuard payload context
  @Post()
  create(@Request() req: any, @Body() dto: { title: string; content?: string }) {
    const userId = req.user.sub;
    return this.postService.create(userId, dto);
  }

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: { title?: string; content?: string }) {
    return this.postService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(+id);
  }
}