import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getProfile(@Req() request: AuthenticatedRequest) {
    return this.successResponse(
      await this.profilesService.getForUser(request.user.sub),
    );
  }

  @Patch('me')
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() input: UpdateProfileDto,
  ) {
    return this.successResponse(
      await this.profilesService.updateForUser(request.user.sub, input),
    );
  }

  private successResponse<T>(data: T) {
    return {
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
