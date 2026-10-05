import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, it } from '@jest/globals';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const accessSecret = 'phase-three-app-test-access-secret-is-long-enough';
const refreshSecret = 'phase-three-app-test-refresh-secret-is-long-enough';
const originalAccessSecret = process.env.JWT_SECRET;
const originalRefreshSecret = process.env.REFRESH_TOKEN_SECRET;

describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.JWT_SECRET = accessSecret;
    process.env.REFRESH_TOKEN_SECRET = refreshSecret;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(() => {
    restoreEnvironmentVariable('JWT_SECRET', originalAccessSecret);
    restoreEnvironmentVariable('REFRESH_TOKEN_SECRET', originalRefreshSecret);
  });

  it('loads all feature modules and protects profile and dashboard routes', async () => {
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
      .get('/api/v1/goals/progress')
      .expect(401);
    await request(app.getHttpServer()).get('/api/v1/nutrition').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/nutrition/summary')
      .expect(401);
  });
});

function restoreEnvironmentVariable(
  name: string,
  value: string | undefined,
): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
