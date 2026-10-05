import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WaterService } from './water.service';

describe('WaterService', () => {
  let service: WaterService;
  let prismaMock: {
    waterEntry: {
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
      waterEntry: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amountMl: null } }),
        create: jest.fn().mockResolvedValue({ id: 'water-1' }),
        findFirst: jest.fn().mockResolvedValue({ id: 'water-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new WaterService(prismaMock as unknown as PrismaService);
  });

  it('lists only the owner records and sums intake in the date range', async () => {
    prismaMock.waterEntry.findMany.mockResolvedValue([{ id: 'water-1' }]);
    prismaMock.waterEntry.count.mockResolvedValue(1);
    prismaMock.waterEntry.aggregate.mockResolvedValue({
      _sum: { amountMl: 1800 },
    });

    const result = await service.listForUser('owner-1', {
      from: '2026-10-01',
      to: '2026-10-05',
      page: 1,
      limit: 20,
    });

    expect(prismaMock.waterEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'owner-1',
          date: {
            gte: new Date('2026-10-01T00:00:00.000Z'),
            lte: new Date('2026-10-05T00:00:00.000Z'),
          },
        },
      }),
    );
    expect(result.totalMl).toBe(1800);
    expect(result.items).toHaveLength(1);
  });

  it('rejects reversed date filters', async () => {
    await expect(
      service.listForUser('owner-1', {
        from: '2026-10-06',
        to: '2026-10-05',
        page: 1,
        limit: 20,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates one daily total and rejects an existing day', async () => {
    await service.createForUser('owner-1', {
      date: '2026-10-05',
      amountMl: 1800,
    });
    expect(prismaMock.waterEntry.create).toHaveBeenCalledWith({
      data: {
        userId: 'owner-1',
        date: new Date('2026-10-05T00:00:00.000Z'),
        amountMl: 1800,
        notes: undefined,
      },
    });

    prismaMock.waterEntry.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );
    await expect(
      service.createForUser('owner-1', {
        date: '2026-10-05',
        amountMl: 1900,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('scopes edits and deletes to the authenticated owner', async () => {
    await service.updateForUser('owner-1', 'water-1', { amountMl: 2000 });
    await service.deleteForUser('owner-1', 'water-1');

    expect(prismaMock.waterEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'water-1', userId: 'owner-1' },
        data: { amountMl: 2000 },
      }),
    );
    expect(prismaMock.waterEntry.deleteMany).toHaveBeenCalledWith({
      where: { id: 'water-1', userId: 'owner-1' },
    });
  });
});
