import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVegetableDto } from './dto/create-vegetable.dto';
import { UpdateVegetableDto } from './dto/update-vegetable.dto';
import { SetPriceDto } from './dto/set-price.dto';

@Injectable()
export class VegetableService {
  constructor(private prisma: PrismaService) {}

  // Add vegetable stock to a garden
  async create(dto: CreateVegetableDto) {
    const garden = await this.prisma.garden.findUnique({ where: { id: dto.gardenId } });
    if (!garden) throw new NotFoundException(`Garden with ID ${dto.gardenId} not found.`);

    return this.prisma.vegetable.create({
      data: {
        name: dto.name,
        importQty: dto.importQty,
        gardenId: dto.gardenId,
      },
    });
  }

  // Get list of all vegetables with latest prices
  async findAll() {
    return this.prisma.vegetable.findMany({
      include: {
        garden: { select: { id: true, name: true } },
        prices: { orderBy: { appliedAt: 'desc' }, take: 1 },
      },
    });
  }

  // Update import / sold stock with validation constraints
  async update(id: number, dto: UpdateVegetableDto) {
    const veg = await this.prisma.vegetable.findUnique({ where: { id } });
    if (!veg) throw new NotFoundException(`Vegetable with ID ${id} not found.`);

    const newImportQty = dto.importQty ?? veg.importQty;
    const newSoldQty = dto.soldQty ?? veg.soldQty;

    if (newSoldQty > newImportQty) {
      throw new BadRequestException('Sold quantity cannot exceed imported quantity.');
    }

    return this.prisma.vegetable.update({
      where: { id },
      data: { importQty: newImportQty, soldQty: newSoldQty },
    });
  }

  // 1. Create vegetable price record
  async setPrice(vegetableId: number, dto: SetPriceDto) {
    await this.findOneVegetable(vegetableId);

    return this.prisma.vegetablePrice.create({
      data: {
        vegetableId,
        price: dto.price,
      },
    });
  }

  // 2. Update latest vegetable price record
  async updatePrice(vegetableId: number, dto: SetPriceDto) {
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

  // 3. Fetch price details/history of a vegetable
  async getPrice(vegetableId: number) {
    await this.findOneVegetable(vegetableId);

    return this.prisma.vegetablePrice.findMany({
      where: { vegetableId },
      orderBy: { appliedAt: 'desc' },
    });
  }

  // 4. Delete vegetable price records
  async deletePrice(vegetableId: number) {
    await this.findOneVegetable(vegetableId);

    await this.prisma.vegetablePrice.deleteMany({ where: { vegetableId } });
    return { message: `Price records deleted for vegetable ID ${vegetableId}` };
  }

  private async findOneVegetable(id: number) {
    const veg = await this.prisma.vegetable.findUnique({ where: { id } });
    if (!veg) throw new NotFoundException(`Vegetable with ID ${id} not found.`);
    return veg;
  }
}