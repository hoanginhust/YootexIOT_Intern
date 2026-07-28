import { Model } from 'mongoose';
import { User, UserDocument } from './users.schema';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: any): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    update(id: string, updateUserDto: any): Promise<User>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
