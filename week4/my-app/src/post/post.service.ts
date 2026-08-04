import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto'; // Imported pagination DTO
import { ActiveUserData } from '../auth/interface/active-user.interface';

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

  // Fetch paginated posts with skip/take offsets and metadata payload
  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, userId } = query;

    // Calculate database query offset
    const skip = (page - 1) * limit;

    // Concurrent query execution for optimum response speed
    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where: userId ? { userId } : {},
        skip,
        take: limit,
        orderBy: { id: 'desc' }, // Latest posts first
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.post.count({
        where: userId ? { userId } : {},
      }),
    ]);

    // Return standard structured payload
    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Fetch single post details (Hides author email for privacy)
  async findOne(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!post) throw new NotFoundException(`Post with ID ${id} not found.`);
    return post;
  }

  // Update post ONLY if current user is the original author
  async update(id: number, dto: UpdatePostDto, currentUser: ActiveUserData) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Post with ID ${id} not found.`);
    
    if (post.userId !== currentUser.id) {
      throw new ForbiddenException('You are not allowed to edit this post.');
    }

    return this.prisma.post.update({
      where: { id },
      data: dto,
    });
  }

  // Delete post if current user is ADMIN or the Owner
  async remove(id: number, currentUser: ActiveUserData) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Post with ID ${id} not found.`);

    // Convert role to uppercase to prevent casing mismatch
    const userRole = currentUser.role?.toUpperCase();
    const isNotAdmin = userRole !== 'ADMIN';
    const isNotAuthor = post.userId !== currentUser.id;

    // Restrict deletion to Admin or resource owner
    if (isNotAdmin && isNotAuthor) {
      throw new ForbiddenException('You are not allowed to delete this post.');
    }

    await this.prisma.post.delete({
      where: { id },
    });
    return { message: `Successfully deleted post with ID ${id}` };
  }
}