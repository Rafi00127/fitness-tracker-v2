import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PlansService } from './plans.service';

describe('PlansService', () => {
  const transaction = {
    plan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    planItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    workout: { findFirst: jest.fn() },
  } as unknown as Prisma.TransactionClient;

  const prisma = {
    plan: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
    planItem: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (tx: Prisma.TransactionClient) => unknown) =>
        callback(transaction),
    ),
  } as unknown as PrismaService;

  let service: PlansService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlansService(prisma);
  });

  it('rejects reversed plan date bounds before creating a plan', async () => {
    await expect(
      service.createForUser('owner-1', {
        name: 'Training block',
        startDate: '2026-10-31',
        endDate: '2026-10-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.plan.create).not.toHaveBeenCalled();
  });

  it('lists plans using only the authenticated owner', async () => {
    jest.mocked(prisma.plan.findMany).mockResolvedValue([]);
    jest.mocked(prisma.plan.count).mockResolvedValue(0);

    await service.listForUser('owner-1', { page: 1, limit: 20 });

    expect(prisma.plan.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'owner-1' } }),
    );
  });

  it('rejects a scheduled date outside the plan bounds', async () => {
    jest.mocked(prisma.plan.findFirst).mockResolvedValue({
      id: 'plan-1',
      startDate: new Date('2026-10-10T00:00:00.000Z'),
      endDate: new Date('2026-10-20T00:00:00.000Z'),
    } as never);

    await expect(
      service.createItemForUser('owner-1', 'plan-1', {
        title: 'Strength day',
        scheduledDate: '2026-10-05',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.planItem.create).not.toHaveBeenCalled();
  });

  it('does not allow linking a workout owned by another user', async () => {
    jest.mocked(transaction.planItem.findFirst).mockResolvedValue({
      id: 'item-1',
      planId: 'plan-1',
      title: 'Strength day',
      scheduledDate: new Date('2026-10-12T00:00:00.000Z'),
      notes: null,
      workoutId: null,
      completedAt: null,
      plan: { startDate: null, endDate: null },
    } as never);
    jest.mocked(transaction.workout.findFirst).mockResolvedValue(null);

    await expect(
      service.updateItemForUser('owner-1', 'plan-1', 'item-1', {
        workoutId: 'another-users-workout',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.workout.findFirst).toHaveBeenCalledWith({
      where: { id: 'another-users-workout', userId: 'owner-1' },
      select: { id: true },
    });
    expect(transaction.planItem.update).not.toHaveBeenCalled();
  });

  it('marks a session complete when linking an owned workout', async () => {
    jest.mocked(transaction.planItem.findFirst).mockResolvedValue({
      id: 'item-1',
      planId: 'plan-1',
      title: 'Strength day',
      scheduledDate: new Date('2026-10-12T00:00:00.000Z'),
      notes: null,
      workoutId: null,
      completedAt: null,
      plan: { startDate: null, endDate: null },
    } as never);
    jest.mocked(transaction.workout.findFirst).mockResolvedValue({
      id: 'workout-1',
    } as never);
    jest.mocked(transaction.planItem.update).mockResolvedValue({
      id: 'item-1',
      planId: 'plan-1',
      title: 'Strength day',
      scheduledDate: new Date('2026-10-12T00:00:00.000Z'),
      notes: null,
      workoutId: 'workout-1',
      completedAt: new Date('2026-10-07T00:00:00.000Z'),
      workout: {
        id: 'workout-1',
        title: 'Logged strength workout',
        date: new Date('2026-10-12T12:00:00.000Z'),
        durationMinutes: null,
      },
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      updatedAt: new Date('2026-10-07T00:00:00.000Z'),
    } as never);

    const result = await service.updateItemForUser(
      'owner-1',
      'plan-1',
      'item-1',
      { workoutId: 'workout-1' },
    );

    expect(transaction.planItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workoutId: 'workout-1',
          completedAt: expect.any(Date),
        }),
      }),
    );
    expect(result.completed).toBe(true);
    expect(result.workout?.id).toBe('workout-1');
  });

  it('does not mark a workout-linked session incomplete', async () => {
    jest.mocked(transaction.planItem.findFirst).mockResolvedValue({
      id: 'item-1',
      planId: 'plan-1',
      title: 'Strength day',
      scheduledDate: new Date('2026-10-12T00:00:00.000Z'),
      notes: null,
      workoutId: 'workout-1',
      completedAt: new Date('2026-10-07T00:00:00.000Z'),
      plan: { startDate: null, endDate: null },
    } as never);

    await expect(
      service.updateItemForUser('owner-1', 'plan-1', 'item-1', {
        completed: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('preserves completion when unlinking a workout', async () => {
    const completedAt = new Date('2026-10-07T00:00:00.000Z');
    jest.mocked(transaction.planItem.findFirst).mockResolvedValue({
      id: 'item-1',
      planId: 'plan-1',
      title: 'Strength day',
      scheduledDate: new Date('2026-10-12T00:00:00.000Z'),
      notes: null,
      workoutId: 'workout-1',
      completedAt,
      plan: { startDate: null, endDate: null },
    } as never);
    jest.mocked(transaction.planItem.update).mockResolvedValue({
      id: 'item-1',
      planId: 'plan-1',
      title: 'Strength day',
      scheduledDate: new Date('2026-10-12T00:00:00.000Z'),
      notes: null,
      workoutId: null,
      completedAt,
      workout: null,
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      updatedAt: new Date('2026-10-07T00:00:00.000Z'),
    } as never);

    const result = await service.updateItemForUser(
      'owner-1',
      'plan-1',
      'item-1',
      { workoutId: null },
    );

    expect(transaction.planItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ workoutId: null }),
      }),
    );
    expect(result.completed).toBe(true);
    expect(result.workoutId).toBeNull();
  });

  it('does not move plan bounds past an existing session', async () => {
    jest.mocked(transaction.plan.findFirst).mockResolvedValue({
      id: 'plan-1',
      startDate: null,
      endDate: null,
    } as never);
    jest.mocked(transaction.planItem.count).mockResolvedValue(1);

    await expect(
      service.updateForUser('owner-1', 'plan-1', {
        endDate: '2026-10-10',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transaction.plan.update).not.toHaveBeenCalled();
  });

  it('returns not found for a plan outside the authenticated owner scope', async () => {
    jest.mocked(prisma.plan.findFirst).mockResolvedValue(null);
    await expect(service.getForUser('owner-1', 'foreign-plan')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.plan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'foreign-plan', userId: 'owner-1' },
      }),
    );
  });
});
