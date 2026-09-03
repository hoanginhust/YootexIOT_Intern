import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
// Extends Passport JWT strategy to delegate token validation and database checking
export class AuthGuard extends PassportAuthGuard('jwt') {}