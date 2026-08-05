import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import type { ActiveUserData } from '../auth/interface/active-user.interface';

@ApiTags('Users') // Group endpoints under Users section
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Fetch all users list (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users list retrieved.' })
  @ApiResponse({ status: 403, description: 'Forbidden resource.' })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update authenticated user details' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @UseGuards(AuthGuard('jwt'))
  @Patch()
  update(
    @CurrentUser('id') userId: number, 
    @Body() dto: UpdateUserDto
  ) {
    return this.userService.update(userId, dto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Fetch single user details by ID' })
  @ApiResponse({ status: 200, description: 'User found.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(
    @Param('id') id: string, 
    @CurrentUser() user: ActiveUserData
  ) {
    return this.userService.findOne(+id, user);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user account (Admin or Account Owner only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden action.' })
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(
    @Param('id') id: string, 
    @CurrentUser() user: ActiveUserData
  ) {
    return this.userService.remove(+id, user);
  }
}