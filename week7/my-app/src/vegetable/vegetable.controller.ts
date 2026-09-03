import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { VegetableService } from './vegetable.service';
import { CreateVegetableDto } from './dto/create-vegetable.dto';
import { UpdateVegetableDto } from './dto/update-vegetable.dto';
import { SetPriceDto } from './dto/set-price.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { ActiveUserData } from '../auth/interface/active-user.interface';

@ApiTags('Vegetables')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('gardens/:gardenId/vegetables')
export class VegetableController {
  constructor(private readonly vegetableService: VegetableService) {}

  @ApiOperation({ summary: 'Add a new vegetable to a garden' })
  @ApiResponse({ status: 201, description: 'Vegetable created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the garden owner.' })
  @ApiResponse({ status: 404, description: 'Garden not found.' })
  @Post()
  create(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Body() dto: CreateVegetableDto,
    @CurrentUser() user: ActiveUserData,
  ) {
    // Keep route gardenId as the source of truth
    return this.vegetableService.create(gardenId, dto, user);
  }

  @ApiOperation({ summary: 'List vegetables in a garden' })
  @ApiResponse({ status: 200, description: 'Vegetables retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the garden owner.' })
  @ApiResponse({ status: 404, description: 'Garden not found.' })
  @Get()
  findAll(@Param('gardenId', ParseIntPipe) gardenId: number, @CurrentUser() user: ActiveUserData) {
    return this.vegetableService.findAll(gardenId, user);
  }

  @ApiOperation({ summary: 'Update a vegetable in a garden' })
  @ApiResponse({ status: 200, description: 'Vegetable updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid data or sold quantity exceeds imported quantity.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the garden owner.' })
  @ApiResponse({ status: 404, description: 'Garden or vegetable not found.' })
  @Put(':vegetableId')
  update(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
    @Body() dto: UpdateVegetableDto,
    @CurrentUser() user: ActiveUserData,
  ) {
    return this.vegetableService.update(gardenId, vegetableId, dto, user);
  }

  // --- Price Sub-Endpoints ---

  @ApiOperation({ summary: 'Set vegetable price' })
  @ApiResponse({ status: 201, description: 'Price record created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid price data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the garden owner.' })
  @ApiResponse({ status: 404, description: 'Garden or vegetable not found.' })
  @Post(':vegetableId/price')
  setPrice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
    @Body() dto: SetPriceDto,
    @CurrentUser() user: ActiveUserData,
  ) {
    return this.vegetableService.setPrice(gardenId, vegetableId, dto, user);
  }

  @ApiOperation({ summary: 'Update vegetable price' })
  @ApiResponse({ status: 200, description: 'Latest price updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid price data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the garden owner.' })
  @ApiResponse({ status: 404, description: 'Garden, vegetable or price record not found.' })
  @Put(':vegetableId/price')
  updatePrice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
    @Body() dto: SetPriceDto,
    @CurrentUser() user: ActiveUserData,
  ) {
    return this.vegetableService.updatePrice(gardenId, vegetableId, dto, user);
  }

  @ApiOperation({ summary: 'Get vegetable price history' })
  @ApiResponse({ status: 200, description: 'Price history retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the garden owner.' })
  @ApiResponse({ status: 404, description: 'Garden or vegetable not found.' })
  @Get(':vegetableId/price')
  getPrice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
    @CurrentUser() user: ActiveUserData,
  ) {
    return this.vegetableService.getPrice(gardenId, vegetableId, user);
  }

  @ApiOperation({ summary: 'Delete vegetable price records' })
  @ApiResponse({ status: 200, description: 'Price records deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid JWT token.' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the garden owner.' })
  @ApiResponse({ status: 404, description: 'Garden or vegetable not found.' })
  @Delete(':vegetableId/price')
  deletePrice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Param('vegetableId', ParseIntPipe) vegetableId: number,
    @CurrentUser() user: ActiveUserData,
  ) {
    return this.vegetableService.deletePrice(gardenId, vegetableId, user);
  }
}
