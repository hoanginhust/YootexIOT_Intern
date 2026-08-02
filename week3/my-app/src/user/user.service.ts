import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Fetch all users with profiles and posts (ADMIN only)
  async findAll(currentUser: any) {
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can access this resource.');
    }
    return this.prisma.user.findMany({
      include: { profile: true, posts: true },
    });
  }

  // Fetch single user profile by ID safely (Admin/Owner get full, others get public)
  async findOne(id: number, currentUser?: any) {
    const isPrivileged = currentUser && (currentUser.role === 'ADMIN' || currentUser.id === id);

    if (isPrivileged) {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { profile: true, posts: true },
      });
      if (!user) throw new NotFoundException(`User with ID ${id} does not exist.`);
      return user;
    } else {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          profile: true,
          posts: true,
        },
      });
      if (!user) throw new NotFoundException(`User with ID ${id} does not exist.`);
      return user;
    }
  }

  // Update current user details directly (Secure by default)
  async update(id: number, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  // Remove user record entirely (ADMIN or Owner self-delete)
  async remove(id: number, currentUser: any) {
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      throw new ForbiddenException('You are not allowed to delete this user.');
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: `Successfully deleted user with ID ${id}` };
  }
}