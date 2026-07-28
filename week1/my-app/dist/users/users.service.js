"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const users_schema_1 = require("./users.schema");
let UsersService = class UsersService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    async create(createUserDto) {
        const highestUser = await this.userModel.findOne().sort({ userId: -1 }).exec();
        const nextId = highestUser ? highestUser.userId + 1 : 1;
        const newUser = new this.userModel({
            ...createUserDto,
            userId: nextId
        });
        return await newUser.save();
    }
    async findAll() {
        return await this.userModel.find().exec();
    }
    async findOne(id) {
        const user = await this.userModel.findOne({ userId: Number(id) }).exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} does not exist.`);
        }
        return user;
    }
    async update(id, updateUserDto) {
        const user = await this.userModel.findOne({ userId: Number(id) }).exec();
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} does not exist.`);
        }
        if (updateUserDto.name)
            user.name = updateUserDto.name;
        if (updateUserDto.email)
            user.email = updateUserDto.email;
        return await user.save();
    }
    async remove(id) {
        const result = await this.userModel.findOneAndDelete({ userId: Number(id) }).exec();
        if (!result) {
            throw new common_1.NotFoundException(`User with ID ${id} does not exist.`);
        }
        return { message: `Successfully deleted user with ID ${id}` };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(users_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map