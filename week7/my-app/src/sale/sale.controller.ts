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
  @ApiResponse({ status: 400, description: 'Invalid data or insufficient stock.' })
  @ApiResponse({ status: 404, description: 'Vegetable not found.' })
  @Post()
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: ActiveUserData) {
    // TODO: Add ownership check if needed
    return this.saleService.create(dto);
  }

  @ApiOperation({ summary: 'List all sales history' })
  @ApiResponse({ status: 200, description: 'Sales history retrieved successfully.' })
  @Get()
  findAll() {
    return this.saleService.findAll();
  }

  @ApiOperation({ summary: 'Get details of a sale transaction' })
  @ApiResponse({ status: 200, description: 'Sale transaction found.' })
  @ApiResponse({ status: 404, description: 'Sale transaction not found.' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleService.findOne(id);
  }
}