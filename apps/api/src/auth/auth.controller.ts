import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_TTL_SECONDS,
} from './auth.constants';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(response, result.refreshToken);

    return this.successResponse({
      user: result.user,
      accessToken: result.accessToken,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(response, result.refreshToken);

    return this.successResponse({
      user: result.user,
      accessToken: result.accessToken,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(this.readRefreshCookie(request));
    this.clearRefreshCookie(response);

    return this.successResponse({ success: true });
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.readRefreshCookie(request);
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let result: Awaited<ReturnType<AuthService['refresh']>>;
    try {
      result = await this.authService.refresh(refreshToken);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.clearRefreshCookie(response);
      }
      throw error;
    }

    this.setRefreshCookie(response, result.refreshToken);

    return this.successResponse({
      user: result.user,
      accessToken: result.accessToken,
    });
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  private readRefreshCookie(request: Request): string | undefined {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) {
      return undefined;
    }

    const cookiePrefix = `${REFRESH_TOKEN_COOKIE}=`;
    const cookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(cookiePrefix));

    return cookie?.slice(cookiePrefix.length);
  }

  private successResponse<T>(data: T) {
    return {
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
