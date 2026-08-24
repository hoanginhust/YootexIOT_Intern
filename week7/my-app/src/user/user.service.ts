import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { Role, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Fetch all users with their registered gardens (ADMIN only)
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        gardens: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // Fetch single user profile and gardens by ID
  async findOne(id: number, currentUser?: ActiveUserData) {
    const isPrivileged = currentUser && (currentUser.role === Role.ADMIN || currentUser.id === id);

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: isPrivileged,
        role: isPrivileged,
        createdAt: true,
        gardens: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist.`);
    }

    return user;
  }

  // Update authenticated user details (Strictly allows name, password)
  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    // Whitelist only allowable fields to prevent mass-assignment privilege escalation
    const dataToUpdate: Prisma.UserUpdateInput = {};
    if (dto.name) dataToUpdate.name = dto.name;
    if (dto.password) {
      dataToUpdate.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  // Remove user record (ADMIN or Account Owner)
  async remove(id: number, currentUser: ActiveUserData) {
    await this.findOne(id);

    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You are not allowed to delete this user account.');
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: `Successfully deleted user with ID ${id}` };
  }
}