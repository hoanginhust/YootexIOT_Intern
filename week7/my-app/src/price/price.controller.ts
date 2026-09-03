import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PriceService } from './price.service';
import { QueryPriceDto } from './dto/query-price.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { ActiveUserData } from '../auth/interface/active-user.interface';

@ApiTags('Price & Revenue')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller()
export class PriceController {
  constructor(private readonly priceService: PriceService) {}

  @ApiOperation({ summary: 'Get price history filtered by period (day/week/month)' })
  @ApiResponse({ status: 200, description: 'Price history list retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid period query parameter.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @Get('price')
  getPrices(@Query() query: QueryPriceDto, @CurrentUser() user: ActiveUserData) {
    return this.priceService.getPricesByPeriod(query.period, user);
  }

  @ApiOperation({ summary: 'Get total revenue statistics filtered by period (day/week/month)' })
  @ApiResponse({ status: 200, description: 'Total revenue analysis retrieved successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid period query parameter.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @Get('all/price')
  getTotalRevenue(@Query() query: QueryPriceDto, @CurrentUser() user: ActiveUserData) {
    return this.priceService.getTotalRevenueByPeriod(query.period, user);
  }
}