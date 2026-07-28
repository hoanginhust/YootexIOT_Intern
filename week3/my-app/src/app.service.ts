import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Returns hello message object matching controller requirements
  getHello(): { message: string } {
    return { message: 'Hello NestJS!' };
  }
}