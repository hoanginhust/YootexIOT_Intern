import { Controller, Put, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../auth/decorator/current-user.decorator';

@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Self-Service: Update or create personal profile data securely
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  upsert(
    @Body() dto: UpdateProfileDto, 
    @CurrentUser('id') userId: number
  ) {
    return this.profileService.upsertProfile(userId, dto);
  }
}