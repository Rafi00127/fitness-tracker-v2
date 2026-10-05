import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MeasurementsService } from './measurements.service';

describe('MeasurementsService', () => {
  let service: MeasurementsService;
  let prismaMock: {
    measurement: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  const measurement = {
    id: 'measurement-1',
    userId: 'owner-1',
    date: new Date('2026-10-05T00:00:00.000Z'),
    weightKg: new Prisma.Decimal('72.50'),
    waistCm: null,
    chestCm: null,
    hipCm: null,
    bicepsCm: null,
    bodyFatPercent: null,
    notes: null,
    createdAt: new Date('2026-10-05T00:00:00.000Z'),
    updatedAt: new Date('2026-10-05T00:00:00.000Z'),
  };

  beforeEach(() => {
    prismaMock = {
      measurement: {
        findMany: jest.fn().mockResolvedValue([measurement]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(measurement),
        findFirst: jest.fn().mockResolvedValue(measurement),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new MeasurementsService(prismaMock as unknown as PrismaService);
  });

  it('returns owner-scoped measurement history with numeric decimal values', async () => {
    const result = await service.listForUser('owner-1', {
      page: 1,
      limit: 20,
    });

    expect(prismaMock.measurement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'owner-1' },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
    );
    expect(result.items[0].weightKg).toBe(72.5);
  });

  it('creates a measurement when at least one metric is provided', async () => {
    const result = await service.createForUser('owner-1', {
      date: '2026-10-05',
      weightKg: 72.5,
    });

    expect(prismaMock.measurement.create).toHaveBeenCalledWith({
      data: {
        userId: 'owner-1',
        date: new Date('2026-10-05T00:00:00.000Z'),
        weightKg: 72.5,
      },
    });
    expect(result.weightKg).toBe(72.5);
  });

  it('rejects empty measurement snapshots and clearing every metric', async () => {
    await expect(
      service.createForUser('owner-1', { date: '2026-10-05' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prismaMock.measurement.findFirst.mockResolvedValue(measurement);
    await expect(
      service.updateForUser('owner-1', 'measurement-1', {
        weightKg: null,
        waistCm: null,
        chestCm: null,
        hipCm: null,
        bicepsCm: null,
        bodyFatPercent: null,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.measurement.updateMany).not.toHaveBeenCalled();
  });

  it('updates and deletes only records owned by the authenticated user', async () => {
    await service.updateForUser('owner-1', 'measurement-1', {
      waistCm: 82.25,
    });
    await service.deleteForUser('owner-1', 'measurement-1');

    expect(prismaMock.measurement.updateMany).toHaveBeenCalledWith({
      where: { id: 'measurement-1', userId: 'owner-1' },
      data: { waistCm: 82.25 },
    });
    expect(prismaMock.measurement.deleteMany).toHaveBeenCalledWith({
      where: { id: 'measurement-1', userId: 'owner-1' },
    });
  });

  it('does not disclose a record owned by another user', async () => {
    prismaMock.measurement.findFirst.mockResolvedValue(null);
    await expect(
      service.getForUser('owner-1', 'foreign-measurement'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
