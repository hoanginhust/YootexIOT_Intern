import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserService } from './user.service';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import type { ActiveUserData } from '../auth/interface/active-user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Protected: Only accessible by ADMIN role
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // Self-Service: Update current authenticated user's details (e.g. name)
  @UseGuards(AuthGuard('jwt'))
  @Patch()
  update(
    @CurrentUser('id') userId: number, 
    @Body() dto: UpdateUserDto
  ) {
    return this.userService.update(userId, dto);
  }

  // Protected: Accessible by any authenticated user
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(
    @Param('id') id: string, 
    @CurrentUser() user: ActiveUserData
  ) {
    return this.userService.findOne(+id, user);
  }

  // Delete user endpoint (Handled by Admin or Account Owner)
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(
    @Param('id') id: string, 
    @CurrentUser() user: ActiveUserData
  ) {
    return this.userService.remove(+id, user);
  }
}