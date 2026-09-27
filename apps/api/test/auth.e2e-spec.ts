import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';

jest.setTimeout(15_000);

describe('AuthController (e2e)', () => {
  let app: TestingModule;
  let nestApp: INestApplication | undefined;
  type AuthResponse = {
    user: { id: string; email: string; name: string | null };
    accessToken: string;
    refreshToken: string;
  };
  const authService = {
    register: jest.fn<() => Promise<AuthResponse>>(),
    login: jest.fn<() => Promise<AuthResponse>>(),
    refresh: jest.fn<() => Promise<AuthResponse>>(),
    logout: jest.fn<() => Promise<{ success: boolean }>>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    app = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();
  });

  afterEach(async () => {
    await nestApp?.close();
    nestApp = undefined;
  });

  async function createApplication() {
    nestApp = app.createNestApplication();
    nestApp.setGlobalPrefix('api/v1');
    nestApp.useGlobalFilters(new ApiExceptionFilter());
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await nestApp.init();
    return nestApp;
  }

  it('registers and returns the access token while setting an HTTP-only refresh cookie', async () => {
    authService.register.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com', name: null },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const nestApp = await createApplication();
    const response = await request(nestApp.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'user@example.com', password: 'safe-password' })
      .expect(201);

    expect(response.body.data.accessToken).toBe('access-token');
    expect(response.body.data.refreshToken).toBeUndefined();
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('Path=/api/v1/auth');
  });

  it('rejects invalid registration input with the documented error envelope', async () => {
    const nestApp = await createApplication();
    const response = await request(nestApp.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.length).toBeGreaterThan(0);
  });

  it('logs in and returns only the access token in JSON', async () => {
    authService.login.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com', name: null },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const nestApp = await createApplication();
    const response = await request(nestApp.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'safe-password' })
      .expect(200);

    expect(response.body.data.accessToken).toBe('access-token');
    expect(response.body.data.refreshToken).toBeUndefined();
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('rotates the cookie on refresh and clears it on logout', async () => {
    authService.refresh.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com', name: null },
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    authService.logout.mockResolvedValue({ success: true });

    const nestApp = await createApplication();
    const refreshed = await request(nestApp.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refresh_token=old-refresh-token')
      .expect(200);

    expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
    expect(refreshed.body.data.accessToken).toBe('new-access-token');
    expect(refreshed.body.data.user.email).toBe('user@example.com');
    expect(refreshed.headers['set-cookie'][0]).toContain(
      'refresh_token=new-refresh-token',
    );

    const loggedOut = await request(nestApp.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', 'refresh_token=new-refresh-token')
      .expect(200);

    expect(authService.logout).toHaveBeenCalledWith('new-refresh-token');
    expect(loggedOut.headers['set-cookie'][0]).toContain(
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    );
  });

  it('requires the refresh cookie to refresh a session', async () => {
    const nestApp = await createApplication();
    const response = await request(nestApp.getHttpServer())
      .post('/api/v1/auth/refresh')
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('clears a refresh cookie rejected by the authentication service', async () => {
    authService.refresh.mockRejectedValue(
      new UnauthorizedException('Invalid refresh token'),
    );

    const nestApp = await createApplication();
    const response = await request(nestApp.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', 'refresh_token=invalid-token')
      .expect(401);

    expect(response.headers['set-cookie'][0]).toContain('refresh_token=;');
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
