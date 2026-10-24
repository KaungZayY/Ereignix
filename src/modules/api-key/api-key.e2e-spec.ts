import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { MemberRole } from 'generated/prisma/enums';

describe('ApiKeyController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let accessToken: string;
  let organizationId: number;
  let userId: number;
  let projectId: number;
  let apiKeyId: number;

  const registerDto = {
    name: 'John',
    email: 'john@example.com',
    password: 'Password123!',
    organizationName: 'API Key Test Org',
  };

  const createProjectDto = {
    name: 'Website',
    description: 'Company website project',
  };

  const createApiKeyDto = {
    name: 'Production API Key',
  };

  const projectUrl = () => `/v1/organizations/${organizationId}/projects`;

  const baseUrl = () => `${projectUrl()}/${projectId}/api-keys`;

  const authRequest = (method: 'get' | 'post' | 'delete', url: string) => {
    return request(app.getHttpServer())
      [method](url)
      .set('Authorization', `Bearer ${accessToken}`);
  };

  const registerAndCreateProject = async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(registerDto)
      .expect(201);

    userId = registerResponse.body.user.id;
    organizationId = registerResponse.body.organization.id;
    accessToken = registerResponse.body.accessToken;

    const projectResponse = await authRequest('post', projectUrl())
      .send(createProjectDto)
      .expect(201);

    projectId = projectResponse.body.id;
  };

  const truncateTables = async () => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
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

  describe('POST /v1/organizations/:organizationId/projects/:projectId/api-keys', () => {
    it('should create an API key', async () => {
      const response = await authRequest('post', baseUrl())
        .send(createApiKeyDto)
        .expect(201);

      expect(response.body).toEqual({
        apiKey: expect.objectContaining({
          id: expect.any(Number),
          name: createApiKeyDto.name,
          keyId: expect.any(String),
          projectId,
          lastUsedAt: null,
          revokedAt: null,
          createdAt: expect.any(String),
        }),
        secret: expect.any(String),
      });

      expect(response.body.secret).toMatch(
        /^evg_live_[0-9a-f-]{36}_[A-Za-z0-9_-]{43}$/,
      );

      apiKeyId = response.body.apiKey.id;

      const storedKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
      });

      expect(storedKey).toBeDefined();
      expect(storedKey!.keyHash).not.toBe(response.body.secret);
      expect(storedKey!.keyHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should return 401 without an access token', async () => {
      await request(app.getHttpServer())
        .post(baseUrl())
        .send(createApiKeyDto)
        .expect(401);
    });

    it('should return 401 with an invalid access token', async () => {
      await request(app.getHttpServer())
        .post(baseUrl())
        .set('Authorization', 'Bearer invalid-token')
        .send(createApiKeyDto)
        .expect(401);
    });

    it('should reject a developer creating an API key', async () => {
      await prisma.member.updateMany({
        where: { userId, organizationId },
        data: { role: MemberRole.DEVELOPER },
      });

      await authRequest('post', baseUrl()).send(createApiKeyDto).expect(403);
    });

    it('should reject a viewer creating an API key', async () => {
      await prisma.member.updateMany({
        where: { userId, organizationId },
        data: { role: MemberRole.VIEWER },
      });

      await authRequest('post', baseUrl()).send(createApiKeyDto).expect(403);
    });

    it('should return 404 when the project does not exist', async () => {
      await authRequest(
        'post',
        `/v1/organizations/${organizationId}/projects/999999/api-keys`,
      )
        .send(createApiKeyDto)
        .expect(404);
    });
  });

  describe('GET /v1/organizations/:organizationId/projects/:projectId/api-keys', () => {
    it('should list project API keys', async () => {
      await authRequest('post', baseUrl()).send(createApiKeyDto).expect(201);

      const response = await authRequest('get', baseUrl()).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);

      expect(response.body[0]).toEqual(
        expect.objectContaining({
          name: createApiKeyDto.name,
          projectId,
        }),
      );

      // Never expose the raw secret or stored hash when listing keys.
      expect(response.body[0]).not.toHaveProperty('secret');
      expect(response.body[0]).not.toHaveProperty('rawKey');
      expect(response.body[0]).not.toHaveProperty('keyHash');
    });

    it('should return an empty array when no API keys exist', async () => {
      const response = await authRequest('get', baseUrl()).expect(200);

      expect(response.body).toEqual([]);
    });

    it('should allow a viewer to list API keys', async () => {
      await authRequest('post', baseUrl()).send(createApiKeyDto).expect(201);

      await prisma.member.updateMany({
        where: { userId, organizationId },
        data: { role: MemberRole.VIEWER },
      });

      await authRequest('get', baseUrl()).expect(200);
    });

    it('should return 401 without an access token', async () => {
      await request(app.getHttpServer()).get(baseUrl()).expect(401);
    });
  });

  describe('DELETE /v1/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId', () => {
    beforeEach(async () => {
      const response = await authRequest('post', baseUrl())
        .send(createApiKeyDto)
        .expect(201);

      apiKeyId = response.body.apiKey.id;
    });

    it('should revoke an API key', async () => {
      const response = await authRequest(
        'delete',
        `${baseUrl()}/${apiKeyId}`,
      ).expect(200);

      expect(response.body).toEqual({
        message: 'API key revoked successfully.',
      });

      const storedKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
      });

      expect(storedKey).toBeDefined();
      expect(storedKey!.revokedAt).toBeInstanceOf(Date);
    });

    it('should return 404 when the API key does not exist', async () => {
      await authRequest('delete', `${baseUrl()}/999999`).expect(404);
    });

    it('should return 400 for an invalid API key ID', async () => {
      await authRequest('delete', `${baseUrl()}/invalid`).expect(400);
    });

    it('should not allow a viewer to revoke an API key', async () => {
      await prisma.member.updateMany({
        where: { userId, organizationId },
        data: { role: MemberRole.VIEWER },
      });

      await authRequest('delete', `${baseUrl()}/${apiKeyId}`).expect(403);
    });

    it('should not allow a developer to revoke an API key', async () => {
      await prisma.member.updateMany({
        where: { userId, organizationId },
        data: { role: MemberRole.DEVELOPER },
      });

      await authRequest('delete', `${baseUrl()}/${apiKeyId}`).expect(403);
    });

    it('should not revoke an already revoked API key', async () => {
      await authRequest('delete', `${baseUrl()}/${apiKeyId}`).expect(200);

      await authRequest('delete', `${baseUrl()}/${apiKeyId}`).expect(404);
    });

    it('should return 401 without an access token', async () => {
      await request(app.getHttpServer())
        .delete(`${baseUrl()}/${apiKeyId}`)
        .expect(401);
    });
  });
});
