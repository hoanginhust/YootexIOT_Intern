import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ActiveUserData } from '../auth/interface/active-user.interface';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Fetch all users with profiles and posts (Guarded by RolesGuard in controller)
  async findAll() {
    return this.prisma.user.findMany({
      include: { profile: true, posts: true },
    });
  }

  // Fetch single user profile by ID safely with typed optional parameter
  async findOne(id: number, currentUser?: ActiveUserData) {
    const isPrivileged = currentUser && (currentUser.role === 'ADMIN' || currentUser.id === id);

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: isPrivileged,
        role: isPrivileged,
        profile: {
          select: {
            bio: true,
            avatar: true,
          },
        },
        posts: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist.`);
    }

    return user;
  }

  // Update current user details directly
  async update(id: number, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  // Remove user record entirely (ADMIN or Owner self-delete)
  async remove(id: number, currentUser: ActiveUserData) {
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
      throw new ForbiddenException('You are not allowed to delete this user.');
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: `Successfully deleted user with ID ${id}` };
  }
}