import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { INestApplication, VersioningType } from '@nestjs/common';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/live')
        .expect(200);
      expect(response.body).toBeDefined();
      expect(response.body).toStrictEqual({
        status: 'ok',
      });
    });
  });

  describe('GET /v1/health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/health/ready')
        .expect(200);
      expect(response.body).toBeDefined();
      expect(response.body).toStrictEqual({
      status: 'ok',
      checks: {
        database: 'up',
      },
    });
    });
  });
});
