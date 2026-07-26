import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService, 
  ) {}

  // POST /users
  @Post()
  create(@Body() createUserDto: any) {
    return this.authService.register(createUserDto);
  }

  // GET /users
  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  // PUT /users/:id
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: { name?: string; email?: string },
  ) {
    return this.usersService.update(+id, updateUserDto);
  }

  // DELETE /users/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}