import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { Role } from '@prisma/client';

@Injectable()
export class SaleService {
  constructor(private prisma: PrismaService) {}

  // Process a vegetable sale transaction using Prisma Transaction (owner only)
  async create(dto: CreateSaleDto, user: ActiveUserData) {
    await this.ensureGardenOwner(dto.gardenId, user);

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

  // List all sales transactions (ADMIN sees all, USER sees only their own gardens' sales)
  async findAll(user: ActiveUserData) {
    return this.prisma.sale.findMany({
      where: user.role === Role.ADMIN ? {} : { garden: { ownerId: user.id } },
      include: {
        garden: { select: { id: true, name: true } },
        vegetable: { select: { id: true, name: true } },
      },
      orderBy: { soldAt: 'desc' },
    });
  }

  // Get details of a single sale record (owner or admin)
  async findOne(id: number, user: ActiveUserData) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        garden: { select: { id: true, name: true, ownerId: true } },
        vegetable: { select: { id: true, name: true } },
      },
    });

    if (!sale) throw new NotFoundException(`Sale transaction #${id} not found.`);

    if (user.role !== Role.ADMIN && sale.garden.ownerId !== user.id) {
      throw new ForbiddenException('You do not have access to this sale transaction.');
    }

    return sale;
  }

  // STRICT ownership check for business operations (create sale).
  // Even ADMIN cannot create sales in another user's garden.
  private async ensureGardenOwner(gardenId: number, user: ActiveUserData) {
    const garden = await this.prisma.garden.findUnique({ where: { id: gardenId } });
    if (!garden) throw new NotFoundException(`Garden with ID ${gardenId} not found.`);

    if (garden.ownerId !== user.id) {
      throw new ForbiddenException('You do not have access to this garden.');
    }

    return garden;
  }
}