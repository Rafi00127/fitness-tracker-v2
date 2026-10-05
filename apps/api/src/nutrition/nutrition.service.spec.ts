import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NutritionService } from './nutrition.service';

describe('NutritionService', () => {
  let service: NutritionService;
  let prismaMock: {
    nutritionEntry: {
      findMany: jest.Mock;
      count: jest.Mock;
      aggregate: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      nutritionEntry: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({
          _count: {
            _all: 0,
            caloriesKcal: 0,
            proteinGrams: 0,
            carbsGrams: 0,
            fatsGrams: 0,
          },
          _sum: {
            caloriesKcal: null,
            proteinGrams: null,
            carbsGrams: null,
            fatsGrams: null,
          },
        }),
        create: jest.fn().mockResolvedValue(entryRecord()),
        findFirst: jest.fn().mockResolvedValue(entryRecord()),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new NutritionService(prismaMock as unknown as PrismaService);
  });

  it('lists only owner entries in an inclusive date range with pagination', async () => {
    prismaMock.nutritionEntry.findMany.mockResolvedValue([entryRecord()]);
    prismaMock.nutritionEntry.count.mockResolvedValue(3);

    const result = await service.listForUser('owner-1', {
      from: '2026-10-01',
      to: '2026-10-05',
      page: 2,
      limit: 2,
    });

    expect(prismaMock.nutritionEntry.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'owner-1',
        date: {
          gte: new Date('2026-10-01T00:00:00.000Z'),
          lte: new Date('2026-10-05T00:00:00.000Z'),
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: 2,
      take: 2,
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
  });

  it('sums recorded values for the owner and reports non-null counts', async () => {
    prismaMock.nutritionEntry.aggregate.mockResolvedValue({
      _count: {
        _all: 2,
        caloriesKcal: 1,
        proteinGrams: 2,
        carbsGrams: 1,
        fatsGrams: 0,
      },
      _sum: {
        caloriesKcal: 430,
        proteinGrams: new Prisma.Decimal('28.50'),
        carbsGrams: new Prisma.Decimal('51.25'),
        fatsGrams: null,
      },
    });

    const summary = await service.summaryForUser('owner-1', {
      from: '2026-10-01',
      to: '2026-10-05',
    });

    expect(prismaMock.nutritionEntry.aggregate).toHaveBeenCalledWith({
      where: {
        userId: 'owner-1',
        date: {
          gte: new Date('2026-10-01T00:00:00.000Z'),
          lte: new Date('2026-10-05T00:00:00.000Z'),
        },
      },
      _count: {
        _all: true,
        caloriesKcal: true,
        proteinGrams: true,
        carbsGrams: true,
        fatsGrams: true,
      },
      _sum: {
        caloriesKcal: true,
        proteinGrams: true,
        carbsGrams: true,
        fatsGrams: true,
      },
    });
    expect(summary).toEqual({
      entryCount: 2,
      caloriesKcal: { recordedEntryCount: 1, total: 430 },
      proteinGrams: { recordedEntryCount: 2, total: 28.5 },
      carbsGrams: { recordedEntryCount: 1, total: 51.25 },
      fatsGrams: { recordedEntryCount: 0, total: 0 },
    });
  });

  it('rejects reversed and overlong summary ranges', async () => {
    await expect(
      service.summaryForUser('owner-1', {
        from: '2026-10-06',
        to: '2026-10-05',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.summaryForUser('owner-1', {
        from: '2025-01-01',
        to: '2026-01-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates nullable nutrition values as owner-specific records', async () => {
    await service.createForUser('owner-1', {
      date: '2026-10-05',
      description: 'Breakfast',
      caloriesKcal: 430,
      proteinGrams: 28.5,
      carbsGrams: null,
      fatsGrams: null,
    });

    expect(prismaMock.nutritionEntry.create).toHaveBeenCalledWith({
      data: {
        userId: 'owner-1',
        date: new Date('2026-10-05T00:00:00.000Z'),
        description: 'Breakfast',
        caloriesKcal: 430,
        proteinGrams: 28.5,
        carbsGrams: null,
        fatsGrams: null,
        notes: null,
      },
    });
  });

  it('scopes edits and deletes to the authenticated owner', async () => {
    await service.updateForUser('owner-1', 'entry-1', {
      description: 'Updated meal',
      caloriesKcal: null,
    });
    await service.deleteForUser('owner-1', 'entry-1');

    expect(prismaMock.nutritionEntry.updateMany).toHaveBeenCalledWith({
      where: { id: 'entry-1', userId: 'owner-1' },
      data: { description: 'Updated meal', caloriesKcal: null },
    });
    expect(prismaMock.nutritionEntry.deleteMany).toHaveBeenCalledWith({
      where: { id: 'entry-1', userId: 'owner-1' },
    });
  });

  it('does not reveal another user entry', async () => {
    prismaMock.nutritionEntry.findFirst.mockResolvedValue(null);

    await expect(
      service.getForUser('owner-1', 'entry-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prismaMock.nutritionEntry.findFirst).toHaveBeenCalledWith({
      where: { id: 'entry-2', userId: 'owner-1' },
    });
  });

  it('validates calendar dates and reversed list ranges', async () => {
    await expect(
      service.createForUser('owner-1', {
        date: '2026-02-30',
        description: 'Invalid date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.listForUser('owner-1', {
        from: '2026-10-06',
        to: '2026-10-05',
        page: 1,
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function entryRecord() {
  return {
    id: 'entry-1',
    date: new Date('2026-10-05T00:00:00.000Z'),
    description: 'Breakfast',
    caloriesKcal: 430,
    proteinGrams: new Prisma.Decimal('28.50'),
    carbsGrams: new Prisma.Decimal('51.25'),
    fatsGrams: null,
    notes: null,
    createdAt: new Date('2026-10-05T09:00:00.000Z'),
    updatedAt: new Date('2026-10-05T09:00:00.000Z'),
  };
}
