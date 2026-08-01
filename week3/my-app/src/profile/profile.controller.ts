import { Controller, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Self-Service: Update or create personal profile data securely
  @UseGuards(AuthGuard)
  @Put('profile')
  upsert(@Body() dto: UpdateProfileDto, @Request() req: any) {
    const userId = req.user.id; // Automatically extract identity from valid token
    return this.profileService.upsertProfile(userId, dto);
  }
}