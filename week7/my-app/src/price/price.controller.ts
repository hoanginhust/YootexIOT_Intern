import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PriceService } from './price.service';
import { QueryPriceDto } from './dto/query-price.dto';
import { AuthGuard } from '../auth/guard/auth.guard';

@ApiTags('Price & Revenue')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller()
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @ApiOperation({ summary: 'Get price history filtered by period (day/week/month)' })
  @ApiResponse({ status: 200, description: 'Price history list.' })
  @Get('price')
  getPrices(@Query() query: QueryPriceDto) {
    return this.priceService.getPricesByPeriod(query.period);
  }

  @ApiOperation({ summary: 'Get total revenue statistics filtered by period (day/week/month)' })
  @ApiResponse({ status: 200, description: 'Total revenue analysis.' })
  @Get('all/price')
  getTotalRevenue(@Query() query: QueryPriceDto) {
    return this.priceService.getTotalRevenueByPeriod(query.period);
  }
}