import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkoutsService } from './workouts.service';

describe('WorkoutsService', () => {
  let service: WorkoutsService;
  let transactionMock: {
    exercise: { findMany: jest.Mock };
    workout: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    workoutExercise: { deleteMany: jest.Mock };
  };
  let prismaMock: {
    workout: {
      findMany: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  const exerciseRecord = {
    id: 'exercise-1',
    name: 'Squat',
    category: 'Strength',
  };
  const workoutRecord = {
    id: 'workout-1',
    title: 'Leg day',
    date: new Date('2026-10-05T09:00:00.000Z'),
    durationMinutes: 45,
    notes: null,
    createdAt: new Date('2026-10-05T09:00:00.000Z'),
    updatedAt: new Date('2026-10-05T09:00:00.000Z'),
    exerciseEntries: [
      {
        id: 'entry-1',
        exerciseId: exerciseRecord.id,
        exercise: exerciseRecord,
        sets: 3,
        reps: 8,
        weight: new Prisma.Decimal('50.25'),
        durationSeconds: null,
        notes: null,
      },
    ],
  };

  beforeEach(() => {
    transactionMock = {
      exercise: {
        findMany: jest.fn().mockResolvedValue([{ id: 'exercise-1' }]),
      },
      workout: {
        create: jest.fn().mockResolvedValue(workoutRecord),
        findFirst: jest.fn().mockResolvedValue({ id: 'workout-1' }),
        update: jest.fn().mockResolvedValue(workoutRecord),
      },
      workoutExercise: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prismaMock = {
      workout: {
        findMany: jest.fn().mockResolvedValue([workoutRecord]),
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue(workoutRecord),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(
        (callback: (transaction: typeof transactionMock) => unknown) =>
          callback(transactionMock),
      ),
    };
    service = new WorkoutsService(prismaMock as unknown as PrismaService);
  });

  it('creates workouts atomically after verifying every exercise owner', async () => {
    const result = await service.createForUser('owner-1', {
      title: 'Leg day',
      date: '2026-10-05T09:00:00.000Z',
      exerciseEntries: [
        { exerciseId: 'exercise-1', sets: 3, reps: 8, weight: 50.25 },
      ],
    });

    expect(transactionMock.exercise.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['exercise-1'] }, userId: 'owner-1' },
      select: { id: true },
    });
    expect(transactionMock.workout.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'owner-1',
          exerciseEntries: {
            create: [
              expect.objectContaining({
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 8,
                weight: 50.25,
              }),
            ],
          },
        }),
      }),
    );
    expect(result.exerciseEntries[0].weight).toBe(50.25);
  });

  it('rejects a workout entry referencing another user exercise', async () => {
    transactionMock.exercise.findMany.mockResolvedValue([]);

    await expect(
      service.createForUser('owner-1', {
        title: 'Leg day',
        date: '2026-10-05T09:00:00.000Z',
        exerciseEntries: [{ exerciseId: 'foreign-exercise' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transactionMock.workout.create).not.toHaveBeenCalled();
  });

  it('filters workout history by owner and inclusive date range', async () => {
    const result = await service.listForUser('owner-1', {
      from: '2026-10-01T00:00:00.000Z',
      to: '2026-10-05T23:59:59.999Z',
      page: 1,
      limit: 20,
    });

    expect(prismaMock.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'owner-1',
          date: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lte: new Date('2026-10-05T23:59:59.999Z'),
          },
        },
      }),
    );
    expect(result.items[0].exerciseEntries[0].weight).toBe(50.25);
  });

  it('rejects reversed date filters', async () => {
    await expect(
      service.listForUser('owner-1', {
        from: '2026-10-06T00:00:00.000Z',
        to: '2026-10-05T00:00:00.000Z',
        page: 1,
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('replaces entries only when a workout PATCH includes the full list', async () => {
    await service.updateForUser('owner-1', 'workout-1', {
      title: 'Updated',
      exerciseEntries: [{ exerciseId: 'exercise-1', sets: 4 }],
    });

    expect(transactionMock.workoutExercise.deleteMany).toHaveBeenCalledWith({
      where: { workoutId: 'workout-1' },
    });
    expect(transactionMock.workout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'workout-1' },
        data: expect.objectContaining({
          title: 'Updated',
          exerciseEntries: {
            create: [expect.objectContaining({ exerciseId: 'exercise-1' })],
          },
        }),
      }),
    );
  });

  it('does not read or update another user workout', async () => {
    transactionMock.workout.findFirst.mockResolvedValue(null);

    await expect(
      service.updateForUser('owner-1', 'foreign-workout', { title: 'Updated' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(transactionMock.workout.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-workout', userId: 'owner-1' },
      select: { id: true },
    });
    expect(transactionMock.workout.update).not.toHaveBeenCalled();
  });

  it('deletes only a workout belonging to the authenticated user', async () => {
    await service.deleteForUser('owner-1', 'workout-1');

    expect(prismaMock.workout.deleteMany).toHaveBeenCalledWith({
      where: { id: 'workout-1', userId: 'owner-1' },
    });
  });
});
