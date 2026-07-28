import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Fetch all users with profile and posts
  async findAll() {
    return this.prisma.user.findMany({
      include: {
        profile: true,
        posts: true,
      },
    });
  }

  // Fetch single user by ID
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, posts: true },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} does not exist.`);
    return user;
  }

  // Update dynamic user fields
  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  // Remove user entirely from database
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.delete({
      where: { id },
    });
    return { message: `Successfully deleted user with ID ${id}` };
  }
}