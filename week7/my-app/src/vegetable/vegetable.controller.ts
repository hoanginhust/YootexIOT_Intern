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
@Controller('gardens/:gardenId/vegetables')
export class VegetableController {
  constructor(private readonly vegetableService: VegetableService) {}

  @ApiOperation({ summary: 'Add a new vegetable to a garden' })
  @ApiResponse({ status: 201, description: 'Vegetable created successfully.' })
  @Post()
  create(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Body() dto: CreateVegetableDto,
  ) {
    // Keep route gardenId as the source of truth
    return this.vegetableService.create({ ...dto, gardenId });
  }

  @ApiOperation({ summary: 'List vegetables in a garden' })
  @ApiResponse({ status: 200, description: 'Vegetables retrieved successfully.' })
  @Get()
  findAll(@Param('gardenId', ParseIntPipe) gardenId: number) {
    return this.vegetableService.findAll(gardenId);
  }

  @ApiOperation({ summary: 'Update a vegetable in a garden' })
  @ApiResponse({ status: 200, description: 'Vegetable updated successfully.' })
  @Put(':vegetableId')
  update(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
    @Body() dto: UpdateVegetableDto,
  ) {
    return this.vegetableService.update(gardenId, vegetableId, dto);
  }

  // --- Price Sub-Endpoints ---

  @ApiOperation({ summary: 'Set vegetable price' })
  @ApiResponse({ status: 201, description: 'Price record created successfully.' })
  @Post(':vegetableId/price')
  setPrice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
    @Body() dto: SetPriceDto,
  ) {
    return this.vegetableService.setPrice(gardenId, vegetableId, dto);
  }

  @ApiOperation({ summary: 'Update vegetable price' })
  @ApiResponse({ status: 200, description: 'Latest price updated successfully.' })
  @Put(':vegetableId/price')
  updatePrice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
    @Body() dto: SetPriceDto,
  ) {
    return this.vegetableService.updatePrice(gardenId, vegetableId, dto);
  }

  @ApiOperation({ summary: 'Get vegetable price history' })
  @ApiResponse({ status: 200, description: 'Price history retrieved successfully.' })
  @Get(':vegetableId/price')
  getPrice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
  ) {
    return this.vegetableService.getPrice(gardenId, vegetableId);
  }

  @ApiOperation({ summary: 'Delete vegetable price records' })
  @ApiResponse({ status: 200, description: 'Price records deleted successfully.' })
  @Delete(':vegetableId/price')
  deletePrice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
  ) {
    return this.vegetableService.deletePrice(gardenId, vegetableId);
  }
}
