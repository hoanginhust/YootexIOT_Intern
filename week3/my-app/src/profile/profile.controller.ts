import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Update profile attributes bounded inside exact user context framework
  @UseGuards(AuthGuard)
  @Put(':id/profile')
  upsert(@Param('id') id: string, @Body() dto: { bio?: string; avatar?: string }) {
    return this.profileService.upsertProfile(+id, dto);
  }
}