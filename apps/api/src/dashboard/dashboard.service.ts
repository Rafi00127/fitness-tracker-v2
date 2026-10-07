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
        workouts: {
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 5,
          select: {
            id: true,
            title: true,
            date: true,
            durationMinutes: true,
            exerciseEntries: {
              select: {
                exercise: { select: { name: true } },
              },
            },
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
      recentActivity: user.workouts.map((workout) => ({
        id: workout.id,
        title: workout.title,
        date: workout.date,
        durationMinutes: workout.durationMinutes,
        exercises: workout.exerciseEntries.map((entry) => entry.exercise.name),
      })),
      trackingModules: [
        { key: 'workouts', available: true, plannedPhase: 4 },
        { key: 'water', available: true, plannedPhase: 5 },
        { key: 'measurements', available: true, plannedPhase: 5 },
        { key: 'goals', available: true, plannedPhase: 6 },
        { key: 'nutrition', available: true, plannedPhase: 7 },
        { key: 'plans', available: true, plannedPhase: 8 },
      ],
    };
  }
}
