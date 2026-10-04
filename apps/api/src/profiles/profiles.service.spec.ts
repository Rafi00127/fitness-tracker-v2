import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  const user = {
    id: 'owner-1',
    email: 'owner@example.com',
    name: 'Owner',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const profile = {
    userId: user.id,
    heightCm: '170.50',
    weightUnit: 'KG' as const,
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
  };

  let service: ProfilesService;
  let prismaMock: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    profile: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let transactionMock: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    profile: { upsert: jest.Mock };
  };

  beforeEach(() => {
    transactionMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue({ ...user, name: 'Updated name' }),
      },
      profile: { upsert: jest.fn().mockResolvedValue(profile) },
    };
    prismaMock = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn(),
      },
      profile: { upsert: jest.fn().mockResolvedValue(profile) },
      $transaction: jest.fn(
        (callback: (transaction: typeof transactionMock) => unknown) =>
          callback(transactionMock),
      ),
    };
    service = new ProfilesService(prismaMock as unknown as PrismaService);
  });

  it('returns only the requested user profile and converts height to a number', async () => {
    const result = await service.getForUser(user.id);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: user.id } }),
    );
    expect(prismaMock.profile.upsert).toHaveBeenCalledWith({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    expect(result.profile.heightCm).toBe(170.5);
    expect(result.user.email).toBe(user.email);
  });

  it('updates only profile data for the authenticated user', async () => {
    const result = await service.updateForUser(user.id, {
      name: 'Updated name',
      heightCm: 170.5,
      weightUnit: 'LB',
    });

    expect(transactionMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: { name: 'Updated name' },
      }),
    );
    expect(transactionMock.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: user.id },
        update: { heightCm: 170.5, weightUnit: 'LB' },
      }),
    );
    expect(result.user.name).toBe('Updated name');
  });

  it('does not create a profile for a missing user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.getForUser('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prismaMock.profile.upsert).not.toHaveBeenCalled();
  });
});
