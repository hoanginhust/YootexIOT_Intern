import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { VegetableService } from './vegetable.service';
import { CreateVegetableDto } from './dto/create-vegetable.dto';
import { UpdateVegetableDto } from './dto/update-vegetable.dto';
import { SetPriceDto } from './dto/set-price.dto';
import { AuthGuard } from '../auth/guard/auth.guard';

@ApiTags('Vegetables')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('vegetables')
export class VegetableController {
  constructor(private readonly vegetableService: VegetableService) {}

  @ApiOperation({ summary: 'Add a new vegetable' })
  @Post()
  create(@Body() dto: CreateVegetableDto) {
    return this.vegetableService.create(dto);
  }

  @ApiOperation({ summary: 'List all vegetables' })
  @Get()
  findAll() {
    return this.vegetableService.findAll();
  }

  @ApiOperation({ summary: 'Update vegetable import/sold stock' })
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVegetableDto) {
    return this.vegetableService.update(id, dto);
  }

  // --- Price Sub-Endpoints ---

  @ApiOperation({ summary: 'Set vegetable price' })
  @Post(':id/price')
  setPrice(@Param('id', ParseIntPipe) id: number, @Body() dto: SetPriceDto) {
    return this.vegetableService.setPrice(id, dto);
  }

  @ApiOperation({ summary: 'Update vegetable price' })
  @Put(':id/price')
  updatePrice(@Param('id', ParseIntPipe) id: number, @Body() dto: SetPriceDto) {
    return this.vegetableService.updatePrice(id, dto);
  }

  @ApiOperation({ summary: 'Get vegetable price history' })
  @Get(':id/price')
  getPrice(@Param('id', ParseIntPipe) id: number) {
    return this.vegetableService.getPrice(id);
  }

  @ApiOperation({ summary: 'Delete vegetable price records' })
  @Delete(':id/price')
  deletePrice(@Param('id', ParseIntPipe) id: number) {
    return this.vegetableService.deletePrice(id);
  }
}