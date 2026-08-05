import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { ActiveUserData } from '../auth/interface/active-user.interface';

@ApiTags('Posts') // Group endpoints under Posts section
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully.' })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @CurrentUser('id') userId: number, 
    @Body() dto: CreatePostDto
  ) {
    return this.postService.create(userId, dto);
  }

  @ApiOperation({ summary: 'Fetch paginated list of posts with optional userId filter' })
  @ApiResponse({ status: 200, description: 'Paginated list fetched successfully.' })
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.postService.findAll(query);
  }

  @ApiOperation({ summary: 'Fetch single post details by ID' })
  @ApiResponse({ status: 200, description: 'Post found.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update an existing post owned by current user' })
  @ApiResponse({ status: 200, description: 'Post updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden action.' })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() dto: UpdatePostDto, 
    @CurrentUser() user: ActiveUserData
  ) {
    return this.postService.update(+id, dto, user);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a post (Admin or Author only)' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden action.' })
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