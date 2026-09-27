import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACCESS_TOKEN_TTL,
  AUTH_CONFIGURATION,
  AuthConfiguration,
  REFRESH_TOKEN_TTL_SECONDS,
} from './auth.constants';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIGURATION)
    private readonly authConfiguration: AuthConfiguration,
  ) {}

  async register(dto: RegisterAuthDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new BadRequestException('Password exceeds the supported length');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const email = dto.email.trim().toLowerCase();

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            email,
            passwordHash,
            name: dto.name ?? null,
          },
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        });

        const tokens = await this.issueTokens(user.id, transaction);
        return { user, ...tokens };
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Email already registered');
      }

      throw error;
    }
  }

  async login(dto: LoginAuthDto) {
    if (Buffer.byteLength(dto.password, 'utf8') > 72) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub?: unknown; type?: unknown };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.authConfiguration.refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (typeof payload.sub !== 'string' || payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const userId = payload.sub;

    return this.prisma.$transaction(async (transaction) => {
      const tokenHash = hashToken(refreshToken);
      const now = new Date();
      const tokenRecord = await transaction.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (
        !tokenRecord ||
        tokenRecord.userId !== userId ||
        tokenRecord.revokedAt ||
        tokenRecord.expiresAt <= now
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await transaction.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const revokeResult = await transaction.refreshToken.updateMany({
        where: {
          id: tokenRecord.id,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: new Date() },
      });

      if (revokeResult.count !== 1) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        ...(await this.issueTokens(user.id, transaction)),
      };
    });
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return { success: true };
  }

  private async issueTokens(
    userId: string,
    transaction?: Prisma.TransactionClient,
  ) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, type: 'access' },
      {
        expiresIn: ACCESS_TOKEN_TTL,
        secret: this.authConfiguration.accessTokenSecret,
      },
    );

    const refreshTokenValue = await this.jwtService.signAsync(
      { sub: userId, type: 'refresh' },
      {
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
        secret: this.authConfiguration.refreshTokenSecret,
      },
    );

    const refreshTokenStore = transaction
      ? transaction.refreshToken
      : this.prisma.refreshToken;

    await refreshTokenStore.create({
      data: {
        tokenHash: hashToken(refreshTokenValue),
        userId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
