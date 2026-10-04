import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Req() request: AuthenticatedRequest) {
    return {
      data: await this.dashboardService.getSummary(request.user.sub),
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
