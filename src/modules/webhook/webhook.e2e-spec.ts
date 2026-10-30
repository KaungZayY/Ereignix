import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { MemberRole } from 'generated/prisma/enums';

describe('WebhookController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let accessToken: string;
  let organizationId: number;
  let projectId: number;
  let userId: number;

  let endpointId: number;

  const webhookUrl = () =>
    `/v1/organizations/${organizationId}/projects/${projectId}/webhook-endpoints`;

  const authRequest = (method: 'get' | 'post' | 'delete', url: string) => {
    return request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${accessToken}`);
  };

  const createWebhookDto = {
    name: 'Production Webhook',
    url: 'https://example.com/webhooks/events',
    eventNames: ['event.created', 'event.updated'],
  };

  const createWebhookEndpoint = async () => {
    const response = await authRequest('post', webhookUrl())
      .send(createWebhookDto)
      .expect(201);

    endpointId = response.body.endpoint.id;

    return response.body;
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

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await prisma.webhookSubscription.deleteMany();
    await prisma.webhookEndpoint.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.project.deleteMany();
    await prisma.member.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    // Register user and organization
    const registerResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        organizationName: 'Test Organization',
      })
      .expect(201);

    accessToken = registerResponse.body.accessToken;
    organizationId = registerResponse.body.organization.id;
    userId = registerResponse.body.user.id;

    // Create project
    const projectResponse = await authRequest(
      'post',
      `/v1/organizations/${organizationId}/projects`,
    )
      .send({
        name: 'Website',
        description: 'Website project',
      })
      .expect(201);

    projectId = projectResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /webhook-endpoints', () => {
    it('should create a webhook endpoint', async () => {
      const response = await authRequest('post', webhookUrl())
        .send(createWebhookDto)
        .expect(201);

      expect(response.body).toHaveProperty('endpoint');
      expect(response.body).toHaveProperty('secret');

      expect(response.body.endpoint).toMatchObject({
        projectId,
        name: createWebhookDto.name,
        url: createWebhookDto.url,
        enabled: true,
        eventNames: createWebhookDto.eventNames,
      });

      expect(response.body.secret).toBeTruthy();
      expect(typeof response.body.secret).toBe('string');
      expect(response.body.endpoint).not.toHaveProperty('secret');
    });

    it('should create a webhook endpoint with multiple subscriptions', async () => {
      const response = await authRequest('post', webhookUrl())
        .send(createWebhookDto)
        .expect(201);

      expect(response.body.endpoint.eventNames).toHaveLength(2);
      expect(response.body.endpoint.eventNames).toEqual(
        expect.arrayContaining(['event.created', 'event.updated']),
      );
    });

    it('should return 401 if no access token is provided', async () => {
      await request(app.getHttpServer())
        .post(webhookUrl())
        .send(createWebhookDto)
        .expect(401);
    });

    it('should return 401 if an invalid access token is provided', async () => {
      await request(app.getHttpServer())
        .post(webhookUrl())
        .set('Authorization', 'Bearer invalid-token')
        .send(createWebhookDto)
        .expect(401);
    });

    it('should return 403 if the user has VIEWER role', async () => {
      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.VIEWER,
        },
      });

      await authRequest('post', webhookUrl())
        .send(createWebhookDto)
        .expect(403);
    });

    it('should allow a DEVELOPER to create a webhook endpoint', async () => {
      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.DEVELOPER,
        },
      });

      await authRequest('post', webhookUrl())
        .send(createWebhookDto)
        .expect(201);
    });
  });

  describe('GET /webhook-endpoints', () => {
    it('should return an empty array if no webhook endpoints exist', async () => {
      const response = await authRequest('get', webhookUrl()).expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all webhook endpoints for a project', async () => {
      await createWebhookEndpoint();

      const response = await authRequest('get', webhookUrl()).expect(200);

      expect(response.body).toHaveLength(1);

      expect(response.body[0]).toMatchObject({
        projectId,
        name: createWebhookDto.name,
        url: createWebhookDto.url,
        enabled: true,
        eventNames: createWebhookDto.eventNames,
      });
    });

    it('should not expose webhook secrets when listing endpoints', async () => {
      await createWebhookEndpoint();

      const response = await authRequest('get', webhookUrl()).expect(200);

      expect(response.body[0]).not.toHaveProperty('secret');
    });

    it('should return multiple webhook endpoints', async () => {
      await createWebhookEndpoint();

      await authRequest('post', webhookUrl())
        .send({
          name: 'Second Webhook',
          url: 'https://example.com/webhooks/second',
          eventNames: ['event.deleted'],
        })
        .expect(201);

      const response = await authRequest('get', webhookUrl()).expect(200);

      expect(response.body).toHaveLength(2);
    });

    it('should allow a VIEWER to list webhook endpoints', async () => {
      await createWebhookEndpoint();

      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.VIEWER,
        },
      });

      await authRequest('get', webhookUrl()).expect(200);
    });

    it('should return 401 if no access token is provided', async () => {
      await request(app.getHttpServer()).get(webhookUrl()).expect(401);
    });
  });

  describe('DELETE /webhook-endpoints/:endpointId', () => {
    it('should delete a webhook endpoint', async () => {
      await createWebhookEndpoint();

      const response = await authRequest(
        'delete',
        `${webhookUrl()}/${endpointId}`,
      ).expect(200);

      expect(response.body).toEqual({
        message: 'Webhook endpoint deleted successfully.',
      });

      const deletedEndpoint = await prisma.webhookEndpoint.findUnique({
        where: { id: endpointId },
      });

      expect(deletedEndpoint).toBeNull();
    });

    it('should also delete the endpoint subscriptions', async () => {
      await createWebhookEndpoint();

      await authRequest('delete', `${webhookUrl()}/${endpointId}`).expect(200);

      const subscriptions = await prisma.webhookSubscription.findMany({
        where: { endpointId },
      });

      expect(subscriptions).toHaveLength(0);
    });

    it('should return 400 if the endpoint ID is invalid', async () => {
      await authRequest('delete', `${webhookUrl()}/invalid`).expect(400);
    });

    it('should return 403 if the user has DEVELOPER role', async () => {
      await createWebhookEndpoint();

      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.DEVELOPER,
        },
      });

      await authRequest('delete', `${webhookUrl()}/${endpointId}`).expect(403);
    });

    it('should return 403 if the user has VIEWER role', async () => {
      await createWebhookEndpoint();

      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.VIEWER,
        },
      });

      await authRequest('delete', `${webhookUrl()}/${endpointId}`).expect(403);
    });

    it('should return 401 if no access token is provided', async () => {
      await createWebhookEndpoint();

      await request(app.getHttpServer())
        .delete(`${webhookUrl()}/${endpointId}`)
        .expect(401);
    });
  });
});
