import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto'; // Imported pagination DTO
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { ActiveUserData } from '../auth/interface/active-user.interface';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @CurrentUser('id') userId: number, 
    @Body() dto: CreatePostDto
  ) {
    return this.postService.create(userId, dto);
  }

  // Fetch paginated posts list using query parameters
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.postService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() dto: UpdatePostDto, 
    @CurrentUser() user: ActiveUserData
  ) {
    return this.postService.update(+id, dto, user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'USER')
  @Delete(':id')
  remove(
    @Param('id') id: string, 
    @CurrentUser() user: ActiveUserData
  ) {
    return this.postService.remove(+id, user);
  }
}