import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AUTH_CONFIGURATION } from '../src/auth/auth.constants';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';
import { NutritionController } from '../src/nutrition/nutrition.controller';
import { NutritionService } from '../src/nutrition/nutrition.service';

const accessTokenSecret = 'phase-seven-test-access-secret-at-least-32';

describe('Nutrition endpoints', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const nutritionService = {
    listForUser: jest.fn(),
    summaryForUser: jest.fn(),
    createForUser: jest.fn(),
    getForUser: jest.fn(),
    updateForUser: jest.fn(),
    deleteForUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: accessTokenSecret })],
      controllers: [NutritionController],
      providers: [
        JwtAuthGuard,
        {
          provide: AUTH_CONFIGURATION,
          useValue: {
            accessTokenSecret,
            refreshTokenSecret: 'phase-seven-test-refresh-secret-at-least-32',
          },
        },
        { provide: NutritionService, useValue: nutritionService },
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

  it('requires authentication for nutrition list and summary', async () => {
    await request(app.getHttpServer()).get('/api/v1/nutrition').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/nutrition/summary?from=2026-10-01&to=2026-10-05')
      .expect(401);
  });

  it('derives create ownership from the verified token and validates input', async () => {
    nutritionService.createForUser.mockResolvedValue({
      id: 'entry-1',
      description: 'Breakfast',
    });
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .post('/api/v1/nutrition')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: 'attacker-user',
        date: '2026-10-05',
        description: '  Breakfast  ',
        caloriesKcal: '430',
        proteinGrams: '28.50',
      })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(nutritionService.createForUser).not.toHaveBeenCalled();
  });

  it('creates a valid entry and passes the authenticated owner to the service', async () => {
    nutritionService.createForUser.mockResolvedValue({
      id: 'entry-1',
      description: 'Breakfast',
      caloriesKcal: 430,
    });
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .post('/api/v1/nutrition')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-10-05',
        description: '  Breakfast  ',
        caloriesKcal: '430',
        proteinGrams: '28.50',
      })
      .expect(201);

    expect(nutritionService.createForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({
        date: '2026-10-05',
        description: 'Breakfast',
        caloriesKcal: 430,
        proteinGrams: 28.5,
      }),
    );
    expect(response.body.data.id).toBe('entry-1');
  });

  it('rejects out-of-range and excess-precision nutrients before persistence', async () => {
    const token = await accessToken();

    await request(app.getHttpServer())
      .post('/api/v1/nutrition')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-10-05',
        description: 'Meal',
        caloriesKcal: 10001,
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/nutrition')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-10-05',
        description: 'Meal',
        proteinGrams: 1.234,
      })
      .expect(400);

    expect(nutritionService.createForUser).not.toHaveBeenCalled();
  });

  it('uses authenticated ownership for range summaries', async () => {
    nutritionService.summaryForUser.mockResolvedValue({ entryCount: 0 });
    const token = await accessToken();

    const response = await request(app.getHttpServer())
      .get('/api/v1/nutrition/summary?from=2026-10-01&to=2026-10-05')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(nutritionService.summaryForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ from: '2026-10-01', to: '2026-10-05' }),
    );
    expect(response.body.data.entryCount).toBe(0);
  });

  it('uses the authenticated owner for list, update, and delete', async () => {
    nutritionService.listForUser.mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
    nutritionService.updateForUser.mockResolvedValue({ id: 'entry-1' });
    nutritionService.deleteForUser.mockResolvedValue({ success: true });
    const token = await accessToken();

    await request(app.getHttpServer())
      .get('/api/v1/nutrition?from=2026-10-01&to=2026-10-05')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch('/api/v1/nutrition/entry-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ caloriesKcal: null })
      .expect(200);
    await request(app.getHttpServer())
      .delete('/api/v1/nutrition/entry-1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(nutritionService.listForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({ from: '2026-10-01', to: '2026-10-05' }),
    );
    expect(nutritionService.updateForUser).toHaveBeenCalledWith(
      'owner-1',
      'entry-1',
      expect.objectContaining({ caloriesKcal: null }),
    );
    expect(nutritionService.deleteForUser).toHaveBeenCalledWith(
      'owner-1',
      'entry-1',
    );
  });
});
