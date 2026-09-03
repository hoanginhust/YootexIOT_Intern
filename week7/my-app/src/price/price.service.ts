import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { Role } from '@prisma/client';

@Injectable()
export class PriceService {
  constructor(private prisma: PrismaService) {}

  // Get price change history based on period (day/week/month)
  async getPricesByPeriod(period: string = 'day', user: ActiveUserData) {
    const selectedPeriod = period || 'day';
    const startDate = this.calculateStartDate(selectedPeriod);

    return this.prisma.vegetablePrice.findMany({
      where: {
        appliedAt: { gte: startDate },
        ...(user.role !== Role.ADMIN ? { vegetable: { garden: { ownerId: user.id } } } : {}),
      },
      include: {
        vegetable: { select: { id: true, name: true, gardenId: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  // Calculate total revenue analysis based on period (day/week/month)
  async getTotalRevenueByPeriod(period: string = 'day', user: ActiveUserData) {
    const selectedPeriod = period || 'day';
    const startDate = this.calculateStartDate(selectedPeriod);

    const ownershipWhere = user.role !== Role.ADMIN ? { garden: { ownerId: user.id } } : {};
    const where = { soldAt: { gte: startDate }, ...ownershipWhere };

    // Aggregate total amount from Sale records
    const aggregate = await this.prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where,
    });

    // Breakdown per vegetable
    const breakdown = await this.prisma.sale.groupBy({
      by: ['vegetableId'],
      _sum: { totalAmount: true, quantity: true },
      where,
    });

    return {
      period: selectedPeriod,
      since: startDate,
      totalRevenue: aggregate._sum.totalAmount || 0,
      totalTransactions: aggregate._count.id,
      breakdown,
    };
  }

  private calculateStartDate(period: string): Date {
    const now = new Date();
    if (period === 'week') {
      now.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      now.setMonth(now.getMonth() - 1);
    } else {
      // Default: start of current day
      now.setHours(0, 0, 0, 0);
    }
    return now;
  }
}