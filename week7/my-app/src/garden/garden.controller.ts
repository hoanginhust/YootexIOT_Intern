import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { GardenService } from './garden.service';
import { CreateGardenDto } from './dto/create-garden.dto';
import { UpdateGardenDto } from './dto/update-garden.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import type { ActiveUserData } from '../auth/interface/active-user.interface';

@ApiTags('Gardens')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('gardens')
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  @ApiOperation({ summary: 'Create a new garden (Owner or Admin)' })
  @ApiResponse({ status: 201, description: 'Garden created successfully.' })
  @Post()
  create(@Body() createGardenDto: CreateGardenDto, @CurrentUser() user: ActiveUserData) {
    return this.gardenService.create(createGardenDto, user);
  }

  @ApiOperation({ summary: 'List gardens (Admin sees all, User sees owned only)' })
  @ApiResponse({ status: 200, description: 'Gardens retrieved.' })
  @Get()
  findAll(@CurrentUser() user: ActiveUserData) {
    return this.gardenService.findAll(user);
  }

  @ApiOperation({ summary: 'Get garden details by ID' })
  @ApiResponse({ status: 200, description: 'Garden found.' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: ActiveUserData) {
    return this.gardenService.findOne(id, user);
  }

  @ApiOperation({ summary: 'Update garden details' })
  @ApiResponse({ status: 200, description: 'Garden updated.' })
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGardenDto: UpdateGardenDto,
    @CurrentUser() user: ActiveUserData,
  ) {
    return this.gardenService.update(id, updateGardenDto, user);
  }

  @ApiOperation({ summary: 'Delete garden' })
  @ApiResponse({ status: 200, description: 'Garden deleted.' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: ActiveUserData) {
    return this.gardenService.remove(id, user);
  }
}