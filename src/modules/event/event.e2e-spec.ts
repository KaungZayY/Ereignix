import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/infra/prisma/prisma.service';

describe('EventsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let accessToken: string;
  let organizationId: number;
  let projectId: number;
  let apiKeyId: number;
  let apiKeySecret: string;

  const registerDto = {
    name: 'John',
    email: 'john@example.com',
    password: 'Password123!',
    organizationName: 'Event Test Org',
  };

  const createProjectDto = {
    name: 'Website',
    description: 'Company website project',
  };

  const createApiKeyDto = {
    name: 'Event Ingestion Key',
  };

  const eventUrl = '/v1/events';

  const projectUrl = () => `/v1/organizations/${organizationId}/projects`;

  const apiKeyUrl = () => `${projectUrl()}/${projectId}/api-keys`;

  const authRequest = (method: 'get' | 'post' | 'delete', url: string) => {
    return request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${accessToken}`);
  };

  const ingestRequest = () => {
    return request(app.getHttpServer())
      .post(eventUrl)
      .set('x-api-key', apiKeySecret);
  };

  const createApiKey = async () => {
    const response = await authRequest('post', apiKeyUrl())
      .send(createApiKeyDto)
      .expect(201);

    apiKeyId = response.body.apiKey.id;
    apiKeySecret = response.body.secret;
  };

  const registerAndCreateProject = async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(registerDto)
      .expect(201);

    accessToken = registerResponse.body.accessToken;
    organizationId = registerResponse.body.organization.id;

    const projectResponse = await authRequest('post', projectUrl())
      .send(createProjectDto)
      .expect(201);

    projectId = projectResponse.body.id;

    await createApiKey();
  };

  const truncateTables = async () => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Event",
        "ApiKey",
        "Project",
        "Member",
        "Organization",
        "User"
      RESTART IDENTITY CASCADE;
    `);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.enableVersioning({
      type: VersioningType.URI,
    });

    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  beforeEach(async () => {
    await truncateTables();
    await registerAndCreateProject();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('POST /v1/events', () => {
    const createEventDto = {
      name: 'user.signed_up',
      payload: {
        userId: 123,
        email: 'user@example.com',
      },
    };

    it('should ingest an event', async () => {
      const response = await ingestRequest().send(createEventDto).expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          projectId,
          name: createEventDto.name,
          payload: createEventDto.payload,
          idempotencyKey: null,
          createdAt: expect.any(String),
        }),
      );

      const storedEvent = await prisma.event.findUnique({
        where: {
          id: response.body.id,
        },
      });

      expect(storedEvent).toBeDefined();
      expect(storedEvent!.projectId).toBe(projectId);
      expect(storedEvent!.name).toBe(createEventDto.name);
      expect(storedEvent!.payload).toEqual(createEventDto.payload);
    });

    it('should return 401 without an API key', async () => {
      await request(app.getHttpServer())
        .post(eventUrl)
        .send(createEventDto)
        .expect(401);
    });

    it('should return 401 with an invalid API key', async () => {
      await request(app.getHttpServer())
        .post(eventUrl)
        .set('x-api-key', 'invalid-api-key')
        .send(createEventDto)
        .expect(401);
    });

    it('should return 401 when the API key has been revoked', async () => {
      await authRequest('delete', `${apiKeyUrl()}/${apiKeyId}`).expect(200);

      await ingestRequest().send(createEventDto).expect(401);
    });

    it('should reject an empty event name', async () => {
      await ingestRequest()
        .send({
          ...createEventDto,
          name: '',
        })
        .expect(400);
    });

    it('should reject an event name longer than 100 characters', async () => {
      await ingestRequest()
        .send({
          ...createEventDto,
          name: 'a'.repeat(101),
        })
        .expect(400);
    });

    it('should reject a missing payload', async () => {
      await ingestRequest()
        .send({
          name: createEventDto.name,
        })
        .expect(400);
    });

    it('should reject a non-object payload', async () => {
      await ingestRequest()
        .send({
          name: createEventDto.name,
          payload: 'not-an-object',
        })
        .expect(400);
    });

    it('should reject an empty idempotency key', async () => {
      await ingestRequest()
        .send({
          ...createEventDto,
          idempotencyKey: '',
        })
        .expect(400);
    });

    it('should reject an idempotency key longer than 255 characters', async () => {
      await ingestRequest()
        .send({
          ...createEventDto,
          idempotencyKey: 'a'.repeat(256),
        })
        .expect(400);
    });

    it('should return the existing event for a repeated idempotency key', async () => {
      const dto = {
        ...createEventDto,
        idempotencyKey: 'signup-event-123',
      };

      const firstResponse = await ingestRequest().send(dto).expect(201);

      const secondResponse = await ingestRequest()
        .send({
          ...dto,
          payload: {
            userId: 456,
            email: 'different@example.com',
          },
        })
        .expect(201);

      expect(secondResponse.body.id).toBe(firstResponse.body.id);
      expect(secondResponse.body.projectId).toBe(projectId);
      expect(secondResponse.body.payload).toEqual(dto.payload);

      const storedEvents = await prisma.event.findMany({
        where: {
          projectId,
          idempotencyKey: dto.idempotencyKey,
        },
      });

      expect(storedEvents).toHaveLength(1);
    });

    it('should allow the same idempotency key in different projects', async () => {
      const dto = {
        ...createEventDto,
        idempotencyKey: 'shared-idempotency-key',
      };

      const firstResponse = await ingestRequest().send(dto).expect(201);

      // Create another project and an API key for it.
      const secondProjectResponse = await authRequest('post', projectUrl())
        .send({
          name: 'Mobile App',
          description: 'Mobile application project',
        })
        .expect(201);

      const secondProjectId = secondProjectResponse.body.id;

      const secondApiKeyResponse = await authRequest(
        'post',
        `/v1/organizations/${organizationId}/projects/${secondProjectId}/api-keys`,
      )
        .send({
          name: 'Second Project API Key',
        })
        .expect(201);

      const secondResponse = await request(app.getHttpServer())
        .post(eventUrl)
        .set('x-api-key', secondApiKeyResponse.body.secret)
        .send(dto)
        .expect(201);

      expect(firstResponse.body.projectId).toBe(projectId);
      expect(secondResponse.body.projectId).toBe(secondProjectId);
      expect(secondResponse.body.id).not.toBe(firstResponse.body.id);
    });
  });
});
