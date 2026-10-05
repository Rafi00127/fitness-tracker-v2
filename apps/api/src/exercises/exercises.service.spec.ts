import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ExercisesService } from './exercises.service';

describe('ExercisesService', () => {
  let service: ExercisesService;
  let prismaMock: {
    exercise: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      exercise: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'exercise-1' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'exercise-1' }),
        update: jest
          .fn()
          .mockResolvedValue({ id: 'exercise-1', name: 'Squat' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new ExercisesService(prismaMock as unknown as PrismaService);
  });

  it('searches only the authenticated user catalog and returns pagination', async () => {
    prismaMock.exercise.findMany.mockResolvedValue([{ id: 'exercise-1' }]);
    prismaMock.exercise.count.mockResolvedValue(1);

    const result = await service.listForUser('owner-1', {
      q: 'squat',
      page: 2,
      limit: 10,
    });

    expect(prismaMock.exercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'owner-1',
          OR: [
            { name: { contains: 'squat', mode: 'insensitive' } },
            { category: { contains: 'squat', mode: 'insensitive' } },
          ],
        },
        skip: 10,
        take: 10,
      }),
    );
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('creates exercise records for the token owner only', async () => {
    await service.createForUser('owner-1', {
      name: 'Squat',
      category: 'Strength',
      notes: null,
    });

    expect(prismaMock.exercise.create).toHaveBeenCalledWith({
      data: {
        userId: 'owner-1',
        name: 'Squat',
        category: 'Strength',
        notes: null,
      },
    });
  });

  it('does not expose another user exercise as a detail record', async () => {
    prismaMock.exercise.findFirst.mockResolvedValue(null);

    await expect(
      service.getForUser('owner-1', 'other-users-exercise'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.exercise.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-users-exercise', userId: 'owner-1' },
    });
  });

  it('updates and deletes only exercises owned by the authenticated user', async () => {
    await service.updateForUser('owner-1', 'exercise-1', { name: 'Squat' });
    await service.deleteForUser('owner-1', 'exercise-1');

    expect(prismaMock.exercise.findFirst).toHaveBeenCalledWith({
      where: { id: 'exercise-1', userId: 'owner-1' },
      select: { id: true },
    });
    expect(prismaMock.exercise.deleteMany).toHaveBeenCalledWith({
      where: { id: 'exercise-1', userId: 'owner-1' },
    });
  });

  it('returns not found when an owner deletes a non-owned exercise ID', async () => {
    prismaMock.exercise.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service.deleteForUser('owner-1', 'other-users-exercise'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('preserves workout history when a referenced exercise is deleted', async () => {
    prismaMock.exercise.deleteMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.22.0' },
      ),
    );

    await expect(
      service.deleteForUser('owner-1', 'exercise-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
