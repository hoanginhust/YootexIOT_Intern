import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { ActiveUserData } from '../auth/interface/active-user.interface';

@ApiTags('Sales')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('sales')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @ApiOperation({ summary: 'Create a new vegetable sale transaction' })
  @ApiResponse({ status: 201, description: 'Sale completed successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid data, insufficient stock, vegetable not in this garden or price not set.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the garden owner.' })
  @ApiResponse({ status: 404, description: 'Garden or vegetable not found.' })
  @Post()
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: ActiveUserData) {
    return this.saleService.create(dto, user);
  }

  @ApiOperation({ summary: 'List sales history (own gardens for USER, all for ADMIN)' })
  @ApiResponse({ status: 200, description: 'Sales history retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @Get()
  findAll(@CurrentUser() user: ActiveUserData) {
    return this.saleService.findAll(user);
  }

  @ApiOperation({ summary: 'Get details of a sale transaction' })
  @ApiResponse({ status: 200, description: 'Sale transaction found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - sale does not belong to your garden.' })
  @ApiResponse({ status: 404, description: 'Sale transaction not found.' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: ActiveUserData) {
    return this.saleService.findOne(id, user);
  }
}