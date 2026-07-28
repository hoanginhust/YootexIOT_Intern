import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Retrieve all users along with their profiles and posts
  async findAll() {
    return this.prisma.user.findMany({
      include: {
        profile: true,
        posts: true,
      },
    });
  }

  // Retrieve a specific user by ID along with their profile and posts
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true, posts: true },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} does not exist.`);
    return user;
  }

  // Update user information
  async update(id: number, updateUserDto: { name?: string; email?: string }) {
    await this.findOne(id); // Check if the user exists
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // Delete a user
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.delete({
      where: { id },
    });
    return { message: `Successfully deleted user with ID ${id}` };
  }
}