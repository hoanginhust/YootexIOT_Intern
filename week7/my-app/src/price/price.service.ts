import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PriceService {
  constructor(private prisma: PrismaService) {}

  // Get price change history based on period (day/week/month)
  async getPricesByPeriod(period: string = 'day') {
    const startDate = this.calculateStartDate(period);

    return this.prisma.vegetablePrice.findMany({
      where: {
        appliedAt: { gte: startDate },
      },
      include: {
        vegetable: { select: { id: true, name: true, gardenId: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  // Calculate total revenue analysis based on period (day/week/month)
  async getTotalRevenueByPeriod(period: string = 'day') {
    const startDate = this.calculateStartDate(period);

    // Aggregate total amount from Sale records
    const aggregate = await this.prisma.sale.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        soldAt: { gte: startDate },
      },
    });

    // Detailed breakdown per vegetable
    const breakdown = await this.prisma.sale.groupBy({
      by: ['vegetableId'],
      _sum: { totalAmount: true, quantity: true },
      where: {
        soldAt: { gte: startDate },
      },
    });

    return {
      period,
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
      // Default: today (start of current day)
      now.setHours(0, 0, 0, 0);
    }
    return now;
  }
}