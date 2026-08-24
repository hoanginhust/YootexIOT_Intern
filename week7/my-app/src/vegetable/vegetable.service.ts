import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVegetableDto } from './dto/create-vegetable.dto';
import { UpdateVegetableDto } from './dto/update-vegetable.dto';
import { SetPriceDto } from './dto/set-price.dto';

@Injectable()
export class VegetableService {
  constructor(private prisma: PrismaService) {}

  // Create a vegetable record for one garden
  async create(dto: CreateVegetableDto) {
    const garden = await this.prisma.garden.findUnique({ where: { id: dto.gardenId } });
    if (!garden) throw new NotFoundException(`Garden with ID ${dto.gardenId} not found.`);

    return this.prisma.vegetable.create({
      data: {
        name: dto.name,
        importQty: dto.importQty,
        soldQty: 0,
        gardenId: dto.gardenId,
      },
    });
  }

  // Get vegetables of a specific garden
  async findAll(gardenId: number) {
    await this.ensureGardenExists(gardenId);

    return this.prisma.vegetable.findMany({
      where: { gardenId },
      include: {
        garden: { select: { id: true, name: true } },
        prices: { orderBy: { appliedAt: 'desc' }, take: 1 },
      },
    });
  }

  // Update vegetable info with quantity validation
  async update(gardenId: number, vegetableId: number, dto: UpdateVegetableDto) {
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

  // Add new price record
  async setPrice(gardenId: number, vegetableId: number, dto: SetPriceDto) {
    await this.findOneVegetable(gardenId, vegetableId);

    return this.prisma.vegetablePrice.create({
      data: {
        vegetableId,
        price: dto.price,
      },
    });
  }

  // Update the latest price record only
  async updatePrice(gardenId: number, vegetableId: number, dto: SetPriceDto) {
    await this.findOneVegetable(gardenId, vegetableId);

    const latestPrice = await this.prisma.vegetablePrice.findFirst({
      where: { vegetableId },
      orderBy: { appliedAt: 'desc' },
    });

    if (!latestPrice) throw new NotFoundException(`No price record found for vegetable ID ${vegetableId}.`);

    return this.prisma.vegetablePrice.update({
      where: { id: latestPrice.id },
      data: { price: dto.price },
    });
  }

  // Get price history of one vegetable
  async getPrice(gardenId: number, vegetableId: number) {
    await this.findOneVegetable(gardenId, vegetableId);

    return this.prisma.vegetablePrice.findMany({
      where: { vegetableId },
      orderBy: { appliedAt: 'desc' },
    });
  }

  // Delete all price history of one vegetable
  async deletePrice(gardenId: number, vegetableId: number) {
    await this.findOneVegetable(gardenId, vegetableId);

    await this.prisma.vegetablePrice.deleteMany({ where: { vegetableId } });
    return { message: `Price records deleted for vegetable ID ${vegetableId}` };
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

  private async ensureGardenExists(gardenId: number) {
    const garden = await this.prisma.garden.findUnique({ where: { id: gardenId } });
    if (!garden) throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    return garden;
  }
}
