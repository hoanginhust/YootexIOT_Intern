import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  // Create or update current user profile without id inputs
  async upsertProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found.`);

    // Perform upsert strictly bounded to the authenticated owner id
    return this.prisma.profile.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        bio: dto.bio || '',
        avatar: dto.avatar || '',
      },
    });
  }
}