import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './users.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // POST /users
  async create(createUserDto: any): Promise<User> {
    // Find the user with the highest userId by sorting in descending order
    const highestUser = await this.userModel.findOne().sort({ userId: -1 }).exec();
  
    // If database is empty, start with 1. Otherwise, increment the highest ID by 1.
    const nextId = highestUser ? highestUser.userId + 1 : 1;
  
    const newUser = new this.userModel({ 
      ...createUserDto, 
      userId: nextId 
    });
    return await newUser.save();
  }

  // GET /users
  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  // GET /users/:id
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findOne({ userId: Number(id) }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist.`);
    }
    return user;
  }

  // PUT /users/:id
  async update(id: string, updateUserDto: any): Promise<User> {
    const user = await this.userModel.findOne({ userId: Number(id) }).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} does not exist.`);
    }

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;

    return await user.save();
  }

  // DELETE /users/:id
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.userModel.findOneAndDelete({ userId: Number(id) }).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} does not exist.`);
    }
    return { message: `Successfully deleted user with ID ${id}` };
  }
}