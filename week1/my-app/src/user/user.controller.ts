import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { UsersService, User } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /users
  @Post()
  create(@Body() createUserDto: { name: string; email: string }) {
    return this.usersService.create(createUserDto);
  }

  // GET /users
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