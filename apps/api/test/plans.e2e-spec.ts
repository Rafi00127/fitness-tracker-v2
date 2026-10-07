import { JwtModule, JwtService } from '@nestjs/jwt';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AUTH_CONFIGURATION } from '../src/auth/auth.constants';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';
import { PlansController } from '../src/plans/plans.controller';
import { PlansService } from '../src/plans/plans.service';

const accessTokenSecret = 'phase-eight-test-access-secret-at-least-32';

describe('Plans endpoints', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const plansService = {
    listForUser: jest.fn(),
    scheduleForUser: jest.fn(),
    createForUser: jest.fn(),
    getForUser: jest.fn(),
    updateForUser: jest.fn(),
    deleteForUser: jest.fn(),
    listItemsForUser: jest.fn(),
    createItemForUser: jest.fn(),
    updateItemForUser: jest.fn(),
    deleteItemForUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: accessTokenSecret })],
      controllers: [PlansController],
      providers: [
        JwtAuthGuard,
        {
          provide: AUTH_CONFIGURATION,
          useValue: {
            accessTokenSecret,
            refreshTokenSecret: 'phase-eight-test-refresh-secret-at-least-32',
          },
        },
        { provide: PlansService, useValue: plansService },
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

  it('requires authentication for plan and schedule routes', async () => {
    await request(app.getHttpServer()).get('/api/v1/plans').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/plans/schedule?view=upcoming')
      .expect(401);
  });

  it('rejects unknown fields and invalid schedule view values', async () => {
    const token = await accessToken();
    await request(app.getHttpServer())
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Plan', userId: 'attacker' })
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/plans/schedule?view=all')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(plansService.createForUser).not.toHaveBeenCalled();
  });

  it('derives plan ownership from the access token', async () => {
    plansService.createForUser.mockResolvedValue({
      id: 'plan-1',
      name: 'Training block',
      items: [],
    });
    const token = await accessToken();
    const response = await request(app.getHttpServer())
      .post('/api/v1/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Training block  ', startDate: '2026-10-01' })
      .expect(201);

    expect(plansService.createForUser).toHaveBeenCalledWith(
      'owner-1',
      expect.objectContaining({
        name: 'Training block',
        startDate: '2026-10-01',
      }),
    );
    expect(response.body.data.id).toBe('plan-1');
  });

  it('passes the authenticated owner for nested item updates', async () => {
    plansService.updateItemForUser.mockResolvedValue({
      id: 'item-1',
      planId: 'plan-1',
      completed: true,
    });
    const token = await accessToken();
    await request(app.getHttpServer())
      .patch('/api/v1/plans/plan-1/items/item-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true })
      .expect(200);

    expect(plansService.updateItemForUser).toHaveBeenCalledWith(
      'owner-1',
      'plan-1',
      'item-1',
      expect.objectContaining({ completed: true }),
    );
  });
});
