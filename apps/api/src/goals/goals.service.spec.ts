import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Goal, GoalMetric, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GoalsService } from './goals.service';

describe('GoalsService', () => {
  let service: GoalsService;
  let prismaMock: {
    goal: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    waterEntry: { findUnique: jest.Mock; findMany: jest.Mock };
    workout: { count: jest.Mock; findMany: jest.Mock };
    measurement: { findFirst: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-05T12:00:00.000Z'));
    prismaMock = {
      goal: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      waterEntry: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      workout: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
      },
      measurement: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new GoalsService(prismaMock as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('derives water, weekly workout, and weight progress from owner records', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      makeGoal(GoalMetric.DAILY_WATER_ML, 2000),
      makeGoal(GoalMetric.WEEKLY_WORKOUTS, 4, { id: 'workout-goal' }),
      makeGoal(GoalMetric.TARGET_WEIGHT_KG, 70, {
        id: 'weight-goal',
        startingWeightKg: new Prisma.Decimal(80),
      }),
    ]);
    prismaMock.goal.count.mockResolvedValue(3);
    prismaMock.waterEntry.findUnique.mockResolvedValue({ amountMl: 1200 });
    prismaMock.workout.count.mockResolvedValue(2);
    prismaMock.measurement.findFirst.mockResolvedValue({
      weightKg: new Prisma.Decimal(74),
    });

    const result = await service.listForUser('owner-1', {
      page: 1,
      limit: 20,
    });

    expect(
      result.items.map(({ currentValue, progressPercent }) => [
        currentValue,
        progressPercent,
      ]),
    ).toEqual([
      [1200, 60],
      [2, 50],
      [74, 60],
    ]);
    expect(result.items.every(({ status }) => status === 'ACTIVE')).toBe(true);
    expect(prismaMock.workout.count).toHaveBeenCalledWith({
      where: {
        userId: 'owner-1',
        date: {
          gte: new Date('2026-10-05T00:00:00.000Z'),
          lt: new Date('2026-10-12T00:00:00.000Z'),
        },
      },
    });
    expect(prismaMock.waterEntry.findUnique).toHaveBeenCalledWith({
      where: {
        userId_date: {
          userId: 'owner-1',
          date: new Date('2026-10-05T00:00:00.000Z'),
        },
      },
      select: { amountMl: true },
    });
  });

  it('captures a weight baseline and derives completion in the target direction', async () => {
    const savedGoal = makeGoal(GoalMetric.TARGET_WEIGHT_KG, 75, {
      startingWeightKg: new Prisma.Decimal(80),
    });
    prismaMock.measurement.findFirst
      .mockResolvedValueOnce({ weightKg: new Prisma.Decimal(80) })
      .mockResolvedValueOnce({ weightKg: new Prisma.Decimal(74) });
    prismaMock.goal.create.mockResolvedValue(savedGoal);

    const result = await service.createForUser('owner-1', {
      title: 'Reach my target',
      metric: GoalMetric.TARGET_WEIGHT_KG,
      targetValue: 75,
    });

    expect(prismaMock.goal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'owner-1',
        startingWeightKg: new Prisma.Decimal(80),
      }),
    });
    expect(result.progressPercent).toBe(100);
    expect(result.status).toBe('COMPLETED');
  });

  it('requires a recorded baseline for target-weight goals', async () => {
    await expect(
      service.createForUser('owner-1', {
        title: 'Reach my target',
        metric: GoalMetric.TARGET_WEIGHT_KG,
        targetValue: 75,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.goal.create).not.toHaveBeenCalled();
  });

  it('rejects invalid metric-specific target values', async () => {
    await expect(
      service.createForUser('owner-1', {
        title: 'Too many workouts',
        metric: GoalMetric.WEEKLY_WORKOUTS,
        targetValue: 8,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.goal.create).not.toHaveBeenCalled();
  });

  it('rejects daily water targets beyond the supported intake range', async () => {
    await expect(
      service.createForUser('owner-1', {
        title: 'Too much water',
        metric: GoalMetric.DAILY_WATER_ML,
        targetValue: 100001,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.goal.create).not.toHaveBeenCalled();
  });

  it('reports overdue status after the target date while progress is unmet', async () => {
    prismaMock.goal.findMany.mockResolvedValue([
      makeGoal(GoalMetric.DAILY_WATER_ML, 2000, {
        targetDate: new Date('2026-10-04T00:00:00.000Z'),
      }),
    ]);

    const result = await service.listForUser('owner-1', {
      page: 1,
      limit: 20,
    });

    expect(result.items[0].status).toBe('OVERDUE');
  });

  it('returns only recorded chart values for the authenticated owner', async () => {
    prismaMock.waterEntry.findMany.mockResolvedValue([
      { date: new Date('2026-10-02T00:00:00.000Z'), amountMl: 1800 },
    ]);
    prismaMock.workout.findMany.mockResolvedValue([
      { date: new Date('2026-10-02T10:00:00.000Z') },
      { date: new Date('2026-10-02T16:00:00.000Z') },
      { date: new Date('2026-10-04T10:00:00.000Z') },
    ]);
    prismaMock.measurement.findMany.mockResolvedValue([
      {
        date: new Date('2026-10-03T00:00:00.000Z'),
        weightKg: new Prisma.Decimal(74.25),
      },
    ]);

    const result = await service.progressForUser('owner-1', {
      from: '2026-10-01',
      to: '2026-10-05',
    });

    expect(result).toEqual({
      water: [{ date: '2026-10-02', value: 1800 }],
      workouts: [
        { date: '2026-10-02', value: 2 },
        { date: '2026-10-04', value: 1 },
      ],
      weight: [{ date: '2026-10-03', value: 74.25 }],
    });
    expect(prismaMock.measurement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'owner-1',
          date: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lt: new Date('2026-10-06T00:00:00.000Z'),
          },
        }),
      }),
    );
  });

  it('rejects invalid or excessively long chart ranges', async () => {
    await expect(
      service.progressForUser('owner-1', {
        from: '2026-10-06',
        to: '2026-10-05',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.progressForUser('owner-1', {
        from: '2025-10-01',
        to: '2026-10-05',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes updates and deletes to the authenticated owner', async () => {
    const existing = makeGoal(GoalMetric.DAILY_WATER_ML, 2000);
    prismaMock.goal.findFirst.mockResolvedValue(existing);
    prismaMock.goal.findMany.mockResolvedValue([existing]);
    prismaMock.goal.count.mockResolvedValue(1);

    await service.updateForUser('owner-1', 'goal-1', { title: 'Updated' });
    await service.deleteForUser('owner-1', 'goal-1');

    expect(prismaMock.goal.updateMany).toHaveBeenCalledWith({
      where: { id: 'goal-1', userId: 'owner-1' },
      data: { title: 'Updated' },
    });
    expect(prismaMock.goal.deleteMany).toHaveBeenCalledWith({
      where: { id: 'goal-1', userId: 'owner-1' },
    });
  });

  it('does not reveal another user goal', async () => {
    prismaMock.goal.findFirst.mockResolvedValue(null);
    await expect(
      service.getForUser('owner-1', 'other-goal'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

function makeGoal(
  metric: GoalMetric,
  targetValue: number,
  overrides: Partial<Goal> = {},
): Goal {
  return {
    id: 'goal-1',
    userId: 'owner-1',
    title: 'Goal',
    metric,
    targetValue: new Prisma.Decimal(targetValue),
    targetDate: null,
    startingWeightKg: null,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    updatedAt: new Date('2026-10-01T00:00:00.000Z'),
    ...overrides,
  };
}
