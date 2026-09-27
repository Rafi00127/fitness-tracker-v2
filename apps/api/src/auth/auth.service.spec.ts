import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_CONFIGURATION, AuthConfiguration } from './auth.constants';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const authConfiguration: AuthConfiguration = {
    accessTokenSecret: 'access-secret-with-more-than-32-characters',
    refreshTokenSecret: 'refresh-secret-with-more-than-32-characters',
  };
  const user = {
    id: 'user-1',
    email: 'user@example.com',
    name: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    passwordHash: 'password-hash',
  };

  let service: AuthService;
  let transactionMock: {
    user: { create: jest.Mock; findUnique: jest.Mock };
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let prismaMock: {
    user: { findUnique: jest.Mock };
    refreshToken: { create: jest.Mock; updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let jwtMock: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let module: TestingModule;

  beforeEach(async () => {
    transactionMock = {
      user: {
        create: jest.fn().mockResolvedValue({
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        }),
        findUnique: jest.fn().mockResolvedValue(user),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue(undefined),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prismaMock = {
      user: { findUnique: jest.fn() },
      refreshToken: {
        create: jest.fn().mockResolvedValue(undefined),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(),
    };
    prismaMock.$transaction.mockImplementation(
      (callback: (transaction: typeof transactionMock) => Promise<unknown>) =>
        callback(transactionMock),
    );
    jwtMock = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValue('refresh-token'),
      verifyAsync: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: AUTH_CONFIGURATION, useValue: authConfiguration },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('normalizes registration email and stores only a hash of the refresh token', async () => {
    const result = await service.register({
      email: ' USER@Example.com ',
      password: 'safe-password',
    });

    expect(transactionMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'user@example.com' }),
      }),
    );
    expect(result.refreshToken).toBe('refresh-token');
    expect(transactionMock.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenHash: createHash('sha256').update('refresh-token').digest('hex'),
        userId: user.id,
      }),
    });
    expect(
      transactionMock.refreshToken.create.mock.calls[0][0].data.tokenHash,
    ).not.toBe(result.refreshToken);
  });

  it('rejects refresh tokens with an invalid token type', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: user.id, type: 'access' });

    await expect(service.refresh('token')).rejects.toMatchObject({
      status: 401,
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('rotates a valid refresh token transactionally and stores its replacement hash', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: user.id, type: 'refresh' });
    transactionMock.refreshToken.findUnique.mockResolvedValue({
      id: 'refresh-1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });

    const result = await service.refresh('old-refresh-token');

    expect(transactionMock.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'refresh-1', revokedAt: null }),
      }),
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(transactionMock.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenHash: createHash('sha256').update('refresh-token').digest('hex'),
      }),
    });
  });

  it('rejects a refresh token that another request has already rotated', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: user.id, type: 'refresh' });
    transactionMock.refreshToken.findUnique.mockResolvedValue({
      id: 'refresh-1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    });
    transactionMock.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.refresh('replayed-refresh-token'),
    ).rejects.toMatchObject({
      status: 401,
    });
    expect(transactionMock.refreshToken.create).not.toHaveBeenCalled();
  });

  it('does not translate database failures during refresh into unauthorized errors', async () => {
    jwtMock.verifyAsync.mockResolvedValue({ sub: user.id, type: 'refresh' });
    const databaseError = new Error('database unavailable');
    transactionMock.refreshToken.findUnique.mockRejectedValue(databaseError);

    await expect(service.refresh('valid-refresh-token')).rejects.toBe(
      databaseError,
    );
  });

  it('rejects passwords that exceed bcrypt byte limits', async () => {
    await expect(
      service.register({
        email: 'user@example.com',
        password: 'a'.repeat(71) + 'é',
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
