import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: any): Promise<import("./users.schema").User>;
    findAll(): Promise<import("./users.schema").User[]>;
    findOne(id: string): Promise<import("./users.schema").User>;
    update(id: string, updateUserDto: any): Promise<import("./users.schema").User>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
