import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Public endpoint for registration
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Public endpoint for login
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}