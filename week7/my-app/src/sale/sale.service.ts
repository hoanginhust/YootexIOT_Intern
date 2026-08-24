import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  // Process a vegetable sale transaction using Prisma Transaction
  async create(dto: CreateSaleDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch vegetable details with its latest set price
      const veg = await tx.vegetable.findUnique({
        where: { id: dto.vegetableId },
        include: { prices: { orderBy: { appliedAt: 'desc' }, take: 1 } },
      });

      if (!veg) throw new NotFoundException(`Vegetable with ID ${dto.vegetableId} not found.`);
      if (veg.gardenId !== dto.gardenId) {
        throw new BadRequestException('Specified vegetable does not belong to this garden.');
      }

      // 2. Stock check
      const availableStock = veg.importQty - veg.soldQty;
      if (availableStock < dto.quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${availableStock}, requested: ${dto.quantity}.`);
      }

      // 3. Price check
      if (veg.prices.length === 0) {
        throw new BadRequestException('Vegetable does not have a price set.');
      }

      const currentPrice = veg.prices[0].price;
      const totalAmount = currentPrice * dto.quantity;

      // 4. Update sold quantity in Vegetable table
      await tx.vegetable.update({
        where: { id: dto.vegetableId },
        data: { soldQty: veg.soldQty + dto.quantity },
      });

      // 5. Create Sale transaction record
      return tx.sale.create({
        data: {
          quantity: dto.quantity,
          totalAmount,
          gardenId: dto.gardenId,
          vegetableId: dto.vegetableId,
        },
        include: {
          garden: { select: { id: true, name: true } },
          vegetable: { select: { id: true, name: true } },
        },
      });
    });
  }

  // List all sales transactions
  async findAll() {
    return this.prisma.sale.findMany({
      include: {
        garden: { select: { id: true, name: true } },
        vegetable: { select: { id: true, name: true } },
      },
      orderBy: { soldAt: 'desc' },
    });
  }

  // Get details of a single sale record
  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        garden: { select: { id: true, name: true } },
        vegetable: { select: { id: true, name: true } },
      },
    });

    if (!sale) throw new NotFoundException(`Sale transaction #${id} not found.`);
    return sale;
  }
}
