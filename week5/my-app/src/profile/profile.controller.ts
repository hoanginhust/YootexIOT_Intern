import { Controller, Put, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../auth/decorator/current-user.decorator';

@ApiTags('Users') // Group profile endpoints under Users section
@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create or update authenticated user personal profile' })
  @ApiResponse({ status: 200, description: 'Profile upserted successfully.' })
  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  upsert(
    @Body() dto: UpdateProfileDto, 
    @CurrentUser('id') userId: number
  ) {
    return this.profileService.upsertProfile(userId, dto);
  }
}