import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        createdAt: true,
        profile: {
          select: {
            heightCm: true,
            weightUnit: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user,
      profileComplete:
        user.name !== null &&
        user.name.trim().length > 0 &&
        user.profile?.heightCm !== null &&
        user.profile?.heightCm !== undefined,
      recentActivity: [],
      trackingModules: [
        { key: 'workouts', available: false, plannedPhase: 4 },
        { key: 'water', available: false, plannedPhase: 5 },
        { key: 'measurements', available: false, plannedPhase: 5 },
        { key: 'goals', available: false, plannedPhase: 6 },
      ],
    };
  }
}
