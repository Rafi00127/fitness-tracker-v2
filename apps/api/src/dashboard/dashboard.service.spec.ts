import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaMock: { user: { findUnique: jest.Mock } };

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          email: 'owner@example.com',
          name: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          profile: { heightCm: null, weightUnit: 'KG' },
        }),
      },
    };
    service = new DashboardService(prismaMock as unknown as PrismaService);
  });

  it('returns the signed-in user summary without pretending future data exists', async () => {
    const summary = await service.getSummary('owner-1');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'owner-1' } }),
    );
    expect(summary.profileComplete).toBe(false);
    expect(summary.recentActivity).toEqual([]);
    expect(summary.trackingModules).toEqual([
      { key: 'workouts', available: false, plannedPhase: 4 },
      { key: 'water', available: false, plannedPhase: 5 },
      { key: 'measurements', available: false, plannedPhase: 5 },
      { key: 'goals', available: false, plannedPhase: 6 },
    ]);
  });

  it('returns not found rather than a success-shaped empty dashboard', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.getSummary('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
