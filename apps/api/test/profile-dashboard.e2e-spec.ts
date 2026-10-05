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
import { ExercisesController } from '../src/exercises/exercises.controller';
import { ExercisesService } from '../src/exercises/exercises.service';
import { WorkoutsController } from '../src/workouts/workouts.controller';
import { WorkoutsService } from '../src/workouts/workouts.service';
import { WaterController } from '../src/water/water.controller';
import { WaterService } from '../src/water/water.service';
import { MeasurementsController } from '../src/measurements/measurements.controller';
import { MeasurementsService } from '../src/measurements/measurements.service';
import { GoalsController } from '../src/goals/goals.controller';
import { GoalsService } from '../src/goals/goals.service';

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
  const exercisesService = {
    listForUser: jest.fn(),
    createForUser: jest.fn(),
    getForUser: jest.fn(),
    updateForUser: jest.fn(),
    deleteForUser: jest.fn(),
  };
  const workoutsService = {
    listForUser: jest.fn(),
    createForUser: jest.fn(),
    getForUser: jest.fn(),
    updateForUser: jest.fn(),
    deleteForUser: jest.fn(),
  };
  const waterService = {
    listForUser: jest.fn(),
    createForUser: jest.fn(),
    getForUser: jest.fn(),
    updateForUser: jest.fn(),
    deleteForUser: jest.fn(),
  };
  const measurementsService = {
    listForUser: jest.fn(),
    createForUser: jest.fn(),
    getForUser: jest.fn(),
    updateForUser: jest.fn(),
    deleteForUser: jest.fn(),
  };
  const goalsService = {
    listForUser: jest.fn(),
    createForUser: jest.fn(),
    getForUser: jest.fn(),
    updateForUser: jest.fn(),
    deleteForUser: jest.fn(),
    progressForUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: accessTokenSecret })],
      controllers: [
        ProfilesController,
        DashboardController,
        ExercisesController,
        WorkoutsController,
        WaterController,
        MeasurementsController,
        GoalsController,
      ],
      providers: [
        JwtAuthGuard,
        { provide: AUTH_CONFIGURATION, useValue: authConfiguration },
        { provide: ProfilesService, useValue: profilesService },
        { provide: DashboardService, useValue: dashboardService },
        { provide: ExercisesService, useValue: exercisesService },
        { provide: WorkoutsService, useValue: workoutsService },
        { provide: WaterService, useValue: waterService },
        { provide: MeasurementsService, useValue: measurementsService },
        { provide: GoalsService, useValue: goalsService },
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
    await request(app.getHttpServer()).get('/api/v1/exercises').expect(401);
    await request(app.getHttpServer()).get('/api/v1/workouts').expect(401);
    await request(app.getHttpServer()).get('/api/v1/water').expect(401);
    await request(app.getHttpServer()).get('/api/v1/measurements').expect(401);
    await request(app.getHttpServer()).get('/api/v1/goals').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/goals/progress?from=2026-10-01&to=2026-10-05')
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

  it('derives exercise list ownership from the authenticated subject', async () => {
    exercisesService.listForUser.mockResolvedValue({
      items: [{ id: 'exercise-1' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .get('/api/v1/exercises?page=1&limit=20')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(exercisesService.listForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ page: 1, limit: 20 }),
    );
    expect(response.body.meta.pagination.total).toBe(1);
  });

  it('validates nested workout data before it reaches the service', async () => {
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .post('/api/v1/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Invalid workout',
        date: 'not-a-date',
        exerciseEntries: [{ exerciseId: 'exercise-1', sets: 0 }],
      })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(workoutsService.createForUser).not.toHaveBeenCalled();
  });

  it('rejects duplicate exercise entries in a workout request', async () => {
    const token = await accessToken();
    const entry = { exerciseId: 'exercise-1', sets: 3 };

    const response = await request(app.getHttpServer())
      .post('/api/v1/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Leg day',
        date: '2026-10-05T09:00:00.000Z',
        exerciseEntries: [entry, entry],
      })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(workoutsService.createForUser).not.toHaveBeenCalled();
  });

  it('rejects null instead of an exercise-entry array when creating a workout', async () => {
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .post('/api/v1/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Leg day',
        date: '2026-10-05T09:00:00.000Z',
        exerciseEntries: null,
      })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(workoutsService.createForUser).not.toHaveBeenCalled();
  });

  it('passes the authenticated owner to workout creation', async () => {
    workoutsService.createForUser.mockResolvedValue({ id: 'workout-1' });
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .post('/api/v1/workouts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Leg day',
        date: '2026-10-05T09:00:00.000Z',
        exerciseEntries: [],
      })
      .expect(201);

    expect(workoutsService.createForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ title: 'Leg day' }),
    );
    expect(response.body.data.id).toBe('workout-1');
  });

  it('derives water-entry ownership from the authenticated subject', async () => {
    waterService.createForUser.mockResolvedValue({
      id: 'water-1',
      amountMl: 1800,
    });
    const token = await accessToken();
    const response = await request(app.getHttpServer())
      .post('/api/v1/water')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-10-05', amountMl: 1800 })
      .expect(201);

    expect(waterService.createForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ date: '2026-10-05', amountMl: 1800 }),
    );
    expect(response.body.data.amountMl).toBe(1800);
  });

  it('rejects invalid daily water amounts before persistence', async () => {
    const token = await accessToken();
    await request(app.getHttpServer())
      .post('/api/v1/water')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-10-05', amountMl: 0 })
      .expect(400);

    expect(waterService.createForUser).not.toHaveBeenCalled();
  });

  it('derives measurement ownership from the authenticated subject', async () => {
    measurementsService.createForUser.mockResolvedValue({
      id: 'measurement-1',
      weightKg: 72.5,
    });
    const token = await accessToken();
    const response = await request(app.getHttpServer())
      .post('/api/v1/measurements')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-10-05', weightKg: 72.5 })
      .expect(201);

    expect(measurementsService.createForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ date: '2026-10-05', weightKg: 72.5 }),
    );
    expect(response.body.data.weightKg).toBe(72.5);
  });

  it('validates measurement values before persistence', async () => {
    const token = await accessToken();
    await request(app.getHttpServer())
      .post('/api/v1/measurements')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-10-05', bodyFatPercent: 101 })
      .expect(400);

    expect(measurementsService.createForUser).not.toHaveBeenCalled();
  });

  it('derives goal ownership from the authenticated subject', async () => {
    goalsService.createForUser.mockResolvedValue({
      id: 'goal-1',
      metric: 'DAILY_WATER_ML',
      targetValue: 2000,
    });
    const token = await accessToken();
    const response = await request(app.getHttpServer())
      .post('/api/v1/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Drink enough water',
        metric: 'DAILY_WATER_ML',
        targetValue: 2000,
        targetDate: '2026-10-31',
      })
      .expect(201);

    expect(goalsService.createForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({
        metric: 'DAILY_WATER_ML',
        targetValue: 2000,
      }),
    );
    expect(response.body.data.id).toBe('goal-1');
  });

  it('rejects unsupported goal metrics and client-supplied progress', async () => {
    const token = await accessToken();
    await request(app.getHttpServer())
      .post('/api/v1/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Unsupported goal',
        metric: 'CALORIES',
        targetValue: 100,
        currentValue: 10,
      })
      .expect(400);

    expect(goalsService.createForUser).not.toHaveBeenCalled();
  });

  it('passes the authenticated owner to chart history', async () => {
    goalsService.progressForUser.mockResolvedValue({
      water: [],
      workouts: [],
      weight: [],
    });
    const token = await accessToken();
    const response = await request(app.getHttpServer())
      .get('/api/v1/goals/progress?from=2026-10-01&to=2026-10-05')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(goalsService.progressForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ from: '2026-10-01', to: '2026-10-05' }),
    );
    expect(response.body.data).toEqual({
      water: [],
      workouts: [],
      weight: [],
    });
  });
});
