import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVegetableDto } from './dto/create-vegetable.dto';
import { UpdateVegetableDto } from './dto/update-vegetable.dto';
import { SetPriceDto } from './dto/set-price.dto';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { Role } from '@prisma/client';

@Injectable()
export class VegetableService {
  constructor(private prisma: PrismaService) {}

  // Create a vegetable record for one garden (owner only)
  async create(gardenId: number, dto: CreateVegetableDto, user: ActiveUserData) {
    await this.ensureGardenOwner(gardenId, user);

    return this.prisma.vegetable.create({
      data: {
        name: dto.name,
        importQty: dto.importQty,
        soldQty: 0,
        gardenId,
      },
    });
  }

  // Get vegetables of a specific garden (owner or admin for monitoring)
  async findAll(gardenId: number, user: ActiveUserData) {
    await this.ensureGardenAccess(gardenId, user);

    return this.prisma.vegetable.findMany({
      where: { gardenId },
      include: {
        garden: { select: { id: true, name: true } },
        prices: { orderBy: { appliedAt: 'desc' }, take: 1 },
      },
    });
  }

  // Aggregate stock inventory summary across all gardens
  async getAggregatedSummary() {
    const stockSummary = await this.prisma.vegetable.groupBy({
      by: ['name'],
      _sum: {
        importQty: true,
        soldQty: true,
      },
      _count: {
        gardenId: true,
      },
    });

    return stockSummary.map((item) => {
      const totalImport = item._sum.importQty || 0;
      const totalSold = item._sum.soldQty || 0;
      return {
        vegetableName: item.name,
        totalGardens: item._count.gardenId,
        totalImportQty: totalImport,
        totalSoldQty: totalSold,
        totalRemainingStock: totalImport - totalSold,
      };
    });
  }

  // Update vegetable info with quantity validation (owner only)
  async update(gardenId: number, vegetableId: number, dto: UpdateVegetableDto, user: ActiveUserData) {
    await this.ensureGardenOwner(gardenId, user);
    const veg = await this.findOneVegetable(gardenId, vegetableId);

    const newImportQty = dto.importQty ?? veg.importQty;
    const newSoldQty = dto.soldQty ?? veg.soldQty;

    if (newSoldQty > newImportQty) {
      throw new BadRequestException('Sold quantity cannot exceed imported quantity.');
    }

    return this.prisma.vegetable.update({
      where: { id: vegetableId },
      data: {
        name: dto.name ?? veg.name,
        importQty: newImportQty,
        soldQty: newSoldQty,
      },
    });
  }

  // Add new price record (owner only)
  async setPrice(gardenId: number, vegetableId: number, dto: SetPriceDto, user: ActiveUserData) {
    await this.ensureGardenOwner(gardenId, user);
    await this.findOneVegetable(gardenId, vegetableId);

    return this.prisma.vegetablePrice.create({
      data: {
        vegetableId,
        price: dto.price,
      },
    });
  }

  // Update the latest price record only (owner only)
  async updatePrice(gardenId: number, vegetableId: number, dto: SetPriceDto, user: ActiveUserData) {
    await this.ensureGardenOwner(gardenId, user);
    await this.findOneVegetable(gardenId, vegetableId);

    const latestPrice = await this.prisma.vegetablePrice.findFirst({
      where: { vegetableId },
      orderBy: { appliedAt: 'desc' },
    });

    if (!latestPrice) {
      throw new NotFoundException(`No price record found for vegetable ID ${vegetableId}.`);
    }

    return this.prisma.vegetablePrice.update({
      where: { id: latestPrice.id },
      data: { price: dto.price },
    });
  }

  // Get price history of one vegetable (owner or admin for monitoring)
  async getPrice(gardenId: number, vegetableId: number, user: ActiveUserData) {
    await this.ensureGardenAccess(gardenId, user);
    await this.findOneVegetable(gardenId, vegetableId);

    return this.prisma.vegetablePrice.findMany({
      where: { vegetableId },
      orderBy: { appliedAt: 'desc' },
    });
  }

  // Delete all price history of one vegetable (owner only)
  async deletePrice(gardenId: number, vegetableId: number, user: ActiveUserData) {
    await this.ensureGardenOwner(gardenId, user);
    await this.findOneVegetable(gardenId, vegetableId);

    await this.prisma.vegetablePrice.deleteMany({ where: { vegetableId } });
    return { message: `Price records deleted for vegetable ID ${vegetableId}` };
  }

  // Strict ownership verification for business mutations
  private async ensureGardenOwner(gardenId: number, user: ActiveUserData) {
    const garden = await this.prisma.garden.findUnique({ where: { id: gardenId } });
    if (!garden) throw new NotFoundException(`Garden with ID ${gardenId} not found.`);

    if (garden.ownerId !== user.id) {
      throw new ForbiddenException('You do not have access to this garden.');
    }

    return garden;
  }

  // Access check for monitoring and read actions
  private async ensureGardenAccess(gardenId: number, user: ActiveUserData) {
    const garden = await this.prisma.garden.findUnique({ where: { id: gardenId } });
    if (!garden) throw new NotFoundException(`Garden with ID ${gardenId} not found.`);

    if (user.role !== Role.ADMIN && garden.ownerId !== user.id) {
      throw new ForbiddenException('You do not have access to this garden.');
    }

    return garden;
  }

  private async findOneVegetable(gardenId: number, vegetableId: number) {
    const veg = await this.prisma.vegetable.findFirst({
      where: { id: vegetableId, gardenId },
    });

    if (!veg) {
      throw new NotFoundException(`Vegetable with ID ${vegetableId} not found in garden ${gardenId}.`);
    }

    return veg;
  }
}