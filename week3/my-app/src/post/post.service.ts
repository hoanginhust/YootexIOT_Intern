import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  // Create a new post bound to a user
  async create(userId: number, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content || '',
        userId,
      },
    });
  }

  // Fetch all posts with user info
  async findAll() {
    return this.prisma.post.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  // Fetch single post by ID
  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!post) throw new NotFoundException(`Post with ID ${id} not found.`);
    return post;
  }

  // Update post dynamic properties
  async update(id: number, dto: UpdatePostDto) {
    await this.findOne(id);
    return this.prisma.post.update({
      where: { id },
      data: dto,
    });
  }

  // Delete post record from database
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.post.delete({
      where: { id },
    });
    return { message: `Successfully deleted post with ID ${id}` };
  }
}