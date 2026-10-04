import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AUTH_CONFIGURATION } from '../src/auth/auth.constants';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';
import { ProfilesController } from '../src/profiles/profiles.controller';
import { ProfilesService } from '../src/profiles/profiles.service';

const accessTokenSecret = 'phase-three-test-access-secret-at-least-32';
const authConfiguration = {
  accessTokenSecret,
  refreshTokenSecret: 'phase-three-test-refresh-secret-at-least-32',
};

describe('Profile and dashboard endpoints', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const profilesService = {
    getForUser: jest.fn(),
    updateForUser: jest.fn(),
  };
  const dashboardService = {
    getSummary: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: accessTokenSecret })],
      controllers: [ProfilesController, DashboardController],
      providers: [
        JwtAuthGuard,
        { provide: AUTH_CONFIGURATION, useValue: authConfiguration },
        { provide: ProfilesService, useValue: profilesService },
        { provide: DashboardService, useValue: dashboardService },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwtService = module.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  async function accessToken() {
    return jwtService.signAsync(
      { sub: 'owner-1', type: 'access' },
      { secret: accessTokenSecret },
    );
  }

  it('protects profile and dashboard endpoints', async () => {
    await request(app.getHttpServer()).get('/api/v1/profiles/me').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/summary')
      .expect(401);
  });

  it('uses the authenticated subject as the profile owner', async () => {
    profilesService.getForUser.mockResolvedValue({ user: {}, profile: {} });
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .get('/api/v1/profiles/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profilesService.getForUser).toHaveBeenCalledWith('owner-1');
    expect(response.body.data.profile).toEqual({});
  });

  it('validates profile updates before calling the service', async () => {
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .patch('/api/v1/profiles/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ heightCm: 301 })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(profilesService.updateForUser).not.toHaveBeenCalled();
  });

  it('returns the authenticated dashboard summary', async () => {
    dashboardService.getSummary.mockResolvedValue({
      user: { email: 'owner@example.com', name: null },
      profileComplete: false,
      recentActivity: [],
      trackingModules: [],
    });
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(dashboardService.getSummary).toHaveBeenCalledWith('owner-1');
    expect(response.body.data.recentActivity).toEqual([]);
  });
});
