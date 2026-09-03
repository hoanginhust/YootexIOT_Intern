import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGardenDto } from './dto/create-garden.dto';
import { UpdateGardenDto } from './dto/update-garden.dto';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { Role, Prisma } from '@prisma/client';

@Injectable()
export class GardenService {
  constructor(private prisma: PrismaService) {}

  // Create a new garden for the authenticated user
  async create(createGardenDto: CreateGardenDto, user: ActiveUserData) {
    return this.prisma.garden.create({
      data: {
        name: createGardenDto.name,
        ownerId: user.id,
      },
    });
  }

  // List gardens based on role (ADMIN sees all, USER sees owned only)
  async findAll(user: ActiveUserData) {
    if (user.role === Role.ADMIN) {
      return this.prisma.garden.findMany({
        include: {
          owner: { select: { id: true, name: true, email: true } },
          vegetables: true,
        },
      });
    }

    return this.prisma.garden.findMany({
      where: { ownerId: user.id },
      include: { vegetables: true },
    });
  }

  // Get single garden details with latest 10 sensor records
  async findOne(id: number, user: ActiveUserData) {
    const garden = await this.prisma.garden.findUnique({
      where: { id },
      include: {
        vegetables: true,
        sensorData: { take: 10, orderBy: { recordedAt: 'desc' } },
      },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${id} not found.`);
    }

    if (user.role !== Role.ADMIN && garden.ownerId !== user.id) {
      throw new ForbiddenException('You do not have access to this garden.');
    }

    return garden;
  }

  // Update garden details (Strictly update name)
  async update(id: number, updateGardenDto: UpdateGardenDto, user: ActiveUserData) {
    await this.findOne(id, user);

    const dataToUpdate: Prisma.GardenUpdateInput = {};
    if (updateGardenDto.name) {
      dataToUpdate.name = updateGardenDto.name;
    }

    return this.prisma.garden.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  // Remove garden record (Admin or Owner only)
  async remove(id: number, user: ActiveUserData) {
    await this.findOne(id, user);

    await this.prisma.garden.delete({ where: { id } });
    return { message: `Successfully deleted garden with ID ${id}` };
  }
}