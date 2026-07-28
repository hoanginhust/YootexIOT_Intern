import { Injectable, NotFoundException } from '@nestjs/common';

// Define 
export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class UsersService {
  private users: User[] = []; // array to save the temporary data
  private idCounter = 1;

  // POST /users
  create(createUserDto: { name: string; email: string }): User {
    const newUser: User = {
      id: this.idCounter++,
      ...createUserDto,
    };
    this.users.push(newUser);
    return newUser;
  }

  // GET /users
  findAll(): User[] {
    return this.users;
  }

  // GET /users/:id
  findOne(id: number): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist.`);
    }
    return user;
  }

  // PUT /users/:id
  update(id: number, updateUserDto: { name?: string; email?: string }): User {
    const user = this.findOne(id);
    
    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;

    return user;
  }

  // DELETE /users/:id
  remove(id: number): { message: string } {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new NotFoundException(`User with ID ${id} does not exist.`);
    }
    this.users.splice(index, 1);
    return { message: `Successfully deleted user with ID ${id}` };
  }
}