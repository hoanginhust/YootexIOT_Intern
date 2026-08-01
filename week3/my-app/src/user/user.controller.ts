import { Controller, Get, Body, Param, Patch, Delete, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './user.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(AuthGuard) // Protect all user routes by default
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Protected: Only ADMIN can view the list of all users
  @Get()
  findAll(@Request() req: any) {
    return this.usersService.findAll(req.user);
  }

  // Public/Guarded: Anyone logged-in can view public details by ID
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.usersService.findOne(+id, req.user);
  }

  // Self-Service: Update currently logged-in user account details
  @Patch()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(@Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    const userId = req.user.id; // Automatically extract target ID from JWT payload
    return this.usersService.update(userId, updateUserDto);
  }

  // Action: ADMIN deletes a user, or a User requests self-deletion
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.usersService.remove(+id, req.user);
  }
}