import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  // Create a new post bound to a user[cite: 50]
  async create(userId: number, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content || '',
        userId,
      },
    });
  }

  // Fetch posts with optional userId filter (Hides author email for privacy)
  async findAll(userId?: number) {
    return this.prisma.post.findMany({
      where: userId ? { userId } : {},
      // Safe selection: Omit email field to protect privacy
      include: { user: { select: { id: true, name: true } } },
    });
  }

  // Fetch single post details (Hides author email for privacy)
  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      // Safe selection: Omit email field to protect privacy
      include: { user: { select: { id: true, name: true } } },
    });
    if (!post) throw new NotFoundException(`Post with ID ${id} not found.`);
    return post;
  }

  // Update post only if current user is ADMIN or the Owner
  async update(id: number, dto: UpdatePostDto, currentUser: any) {
    const post = await this.findOne(id);
    
    if (currentUser.role !== 'ADMIN' && post.userId !== currentUser.id) {
      throw new ForbiddenException('You are not allowed to edit this post.');
    }

    return this.prisma.post.update({
      where: { id },
      data: dto,
    });
  }

  // Delete post only if current user is ADMIN or the Owner
  async remove(id: number, currentUser: any) {
    const post = await this.findOne(id);

    if (currentUser.role !== 'ADMIN' && post.userId !== currentUser.id) {
      throw new ForbiddenException('You are not allowed to delete this post.');
    }

    await this.prisma.post.delete({
      where: { id },
    });
    return { message: `Successfully deleted post with ID ${id}` };
  }
}