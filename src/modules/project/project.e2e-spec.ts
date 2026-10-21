import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { MemberRole } from 'generated/prisma/enums';

describe('ProjectController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let accessToken: string;
  let organizationId: number;
  let userId: number;
  let projectId: number;

  const registerDto = {
    name: 'John',
    email: 'john@example.com',
    password: 'Password123!',
    organizationName: 'Project Test Org',
  };

  const createProjectDto = {
    name: 'Website',
    description: 'Company website project',
  };

  const baseUrl = () => `/v1/organizations/${organizationId}/projects`;

  // Returns an authenticated Supertest request.
  // The HTTP method and URL are supplied by each test.
  const authRequest = (
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
  ) => {
    const req = request(app.getHttpServer())[method](url);

    return req.set('Authorization', `Bearer ${accessToken}`);
  };

  const registerAndLogin = async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(registerDto)
      .expect(201);

    userId = response.body.user.id;
    organizationId = response.body.organization.id;
    accessToken = response.body.accessToken;
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

  const truncateTables = async () => {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Member",
        "Organization",
        "User"
      RESTART IDENTITY CASCADE;
    `);
  };

  beforeEach(async () => {
    await truncateTables();
    await registerAndLogin();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('POST /v1/organizations/:organizationId/projects', () => {
    it('should create a project', async () => {
      const response = await authRequest('post', baseUrl())
        .send(createProjectDto)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: createProjectDto.name,
        }),
      );

      projectId = response.body.id;
    });

    it('should return 401 without an access token', async () => {
      await request(app.getHttpServer())
        .post(baseUrl())
        .send(createProjectDto)
        .expect(401);
    });

    it('should return 401 with an invalid access token', async () => {
      await request(app.getHttpServer())
        .post(baseUrl())
        .set('Authorization', 'Bearer invalid-token')
        .send(createProjectDto)
        .expect(401);
    });

    it('should reject a viewer creating a project', async () => {
      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.VIEWER,
        },
      });

      await authRequest('post', baseUrl()).send(createProjectDto).expect(403);
    });

    it('should reject an invalid organization ID', async () => {
      await authRequest('post', '/v1/organizations/invalid/projects')
        .send(createProjectDto)
        .expect(403);
    });
  });

  describe('GET /v1/organizations/:organizationId/projects', () => {
    it('should list organization projects', async () => {
      await authRequest('post', baseUrl()).send(createProjectDto).expect(201);

      const response = await authRequest('get', baseUrl()).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe(createProjectDto.name);
    });

    it('should return an empty array when there are no projects', async () => {
      const response = await authRequest('get', baseUrl()).expect(200);

      expect(response.body).toEqual([]);
    });

    it('should allow a viewer to list projects', async () => {
      await authRequest('post', baseUrl()).send(createProjectDto).expect(201);

      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.VIEWER,
        },
      });

      await authRequest('get', baseUrl()).expect(200);
    });

    it('should return 401 without an access token', async () => {
      await request(app.getHttpServer()).get(baseUrl()).expect(401);
    });
  });

  describe('GET /v1/organizations/:organizationId/projects/:projectId', () => {
    beforeEach(async () => {
      const response = await authRequest('post', baseUrl())
        .send(createProjectDto)
        .expect(201);

      projectId = response.body.id;
    });

    it('should get a project by ID', async () => {
      const response = await authRequest(
        'get',
        `${baseUrl()}/${projectId}`,
      ).expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: projectId,
          name: createProjectDto.name,
        }),
      );
    });

    it('should return 404 for a nonexistent project', async () => {
      await authRequest('get', `${baseUrl()}/999999`).expect(404);
    });

    it('should reject an invalid project ID', async () => {
      await authRequest('get', `${baseUrl()}/invalid`).expect(400);
    });

    it('should allow a viewer to get a project', async () => {
      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.VIEWER,
        },
      });

      await authRequest('get', `${baseUrl()}/${projectId}`).expect(200);
    });
  });

  describe('PATCH /v1/organizations/:organizationId/projects/:projectId', () => {
    beforeEach(async () => {
      const response = await authRequest('post', baseUrl())
        .send(createProjectDto)
        .expect(201);

      projectId = response.body.id;
    });

    it('should update a project', async () => {
      const updateDto = {
        name: 'Updated Website',
        description: 'Updated project description',
      };

      const response = await authRequest('patch', `${baseUrl()}/${projectId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: projectId,
          name: updateDto.name,
        }),
      );
    });

    it('should return 404 for a nonexistent project', async () => {
      await authRequest('patch', `${baseUrl()}/999999`)
        .send({ name: 'Updated Website' })
        .expect(404);
    });

    it('should reject an invalid project ID', async () => {
      await authRequest('patch', `${baseUrl()}/invalid`)
        .send({ name: 'Updated Website' })
        .expect(400);
    });

    it('should reject a viewer updating a project', async () => {
      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.VIEWER,
        },
      });

      await authRequest('patch', `${baseUrl()}/${projectId}`)
        .send({ name: 'Updated Website' })
        .expect(403);
    });
  });

  describe('DELETE /v1/organizations/:organizationId/projects/:projectId', () => {
    beforeEach(async () => {
      const response = await authRequest('post', baseUrl())
        .send(createProjectDto)
        .expect(201);

      projectId = response.body.id;
    });

    it('should delete a project', async () => {
      await authRequest('delete', `${baseUrl()}/${projectId}`).expect(200);

      await authRequest('get', `${baseUrl()}/${projectId}`).expect(404);
    });

    it('should return 404 for a nonexistent project', async () => {
      await authRequest('delete', `${baseUrl()}/999999`).expect(404);
    });

    it('should reject a developer deleting a project', async () => {
      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.DEVELOPER,
        },
      });

      await authRequest('delete', `${baseUrl()}/${projectId}`).expect(403);
    });

    it('should reject a viewer deleting a project', async () => {
      await prisma.member.updateMany({
        where: {
          userId,
          organizationId,
        },
        data: {
          role: MemberRole.VIEWER,
        },
      });

      await authRequest('delete', `${baseUrl()}/${projectId}`).expect(403);
    });
  });
});
