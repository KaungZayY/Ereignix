import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { INestApplication, VersioningType } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { MemberRole } from 'generated/prisma/enums';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    truncateTables();
  });

  afterAll(async () => {
    truncateTables();
    await app.close();
  });

  describe('POST /v1/auth/register', () => {
    const dto = {
      name: 'John',
      email: 'john@example.com',
      password: 'Password123!',
      organizationName: 'An Corporation',
    };

    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(dto)
        .expect(201);
      expect(response.body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: expect.any(Number),
          name: dto.name,
          email: dto.email,
        },
        organization: {
          id: expect.any(Number),
          name: dto.organizationName,
          slug: 'an-corporation',
        },
      });

      const user = await prisma.user.findUnique({
        where: {
          email: dto.email,
        },
      });
      expect(user).toBeDefined();

      const org = await prisma.organization.findUnique({
        where: {
          slug: 'an-corporation',
        },
      });
      expect(org).toBeDefined();

      const member = await prisma.member.findFirst({
        where: {
          userId: user!.id,
          organizationId: org!.id,
        },
      });

      expect(member).toBeDefined();
      expect(member!.role).toBe(MemberRole.OWNER);
    });

    it('should return 409 if email already exists', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(dto)
        .expect(201);
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(dto)
        .expect(409);
      expect(response.body.message).toBe('Email is already registered.');
    });

    it('should create unique organization slug', async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(dto)
        .expect(201);
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          ...dto,
          email: 'test2@example.com',
        })
        .expect(201);
      expect(res.body.organization.slug).toBe('an-corporation-2');
      const org = await prisma.organization.findUnique({
        where: {
          slug: 'an-corporation-2',
        },
      });
      expect(org).toBeDefined();
    });
  });

  describe('POST /v1/auth/login', () => {
    const dto = {
      name: 'John',
      email: 'john@example.com',
      password: 'Password123!',
      organizationName: 'An Corporation',
    };
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/v1/auth/register').send(dto);
    });

    it('should login successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123!',
        })
        .expect(201);
      expect(response.body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: {
          id: expect.any(Number),
          name: dto.name,
          email: dto.email,
        },
        organization: {
          id: expect.any(Number),
          name: dto.organizationName,
          slug: 'an-corporation',
        },
      });
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'Password123!',
        })
        .expect(401);
      expect(response.body.message).toBe('Invalid email or password.');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword123',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password.');
    });
  });

  describe('POST /v1/auth/refresh', () => {
    const dto = {
      name: 'John',
      email: 'john@example.com',
      password: 'Password123!',
      organizationName: 'An Corporation',
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(dto)
        .expect(201);
    });

    it('should refresh access and refresh tokens successfully', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: dto.email, password: dto.password })
        .expect(201);
      const oldRefreshToken = loginResponse.body.refreshToken;
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);
      expect(response.body).toEqual({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: { id: expect.any(Number), name: dto.name, email: dto.email },
        organization: {
          id: expect.any(Number),
          name: dto.organizationName,
          slug: 'an-corporation',
        },
      });
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).not.toBe(oldRefreshToken);
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);
    });

    it('should return 401 for an invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
      expect(response.body.message).toBe('Invalid refresh token.');
    });

    it('should return 401 when refresh token has been revoked', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: dto.email, password: dto.password })
        .expect(201);
      const refreshToken = loginResponse.body.refreshToken;
      await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
      expect(response.body.message).toBe('Invalid or expired refresh token.');
    });

    it('should return 401 when refresh token is not stored in the database', async () => {
      const jwtService = app.get(JwtService);
      const refreshToken = await jwtService.signAsync({
        sub: 1,
        type: 'refresh',
        jti: 'not-stored-jti',
      });
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
      expect(response.body.message).toBe('Invalid or expired refresh token.');
    });

    it('should return 401 when refresh token belongs to a nonexistent user', async () => {
      const jwtService = app.get(JwtService);
      const refreshToken = await jwtService.signAsync({
        sub: 999999,
        type: 'refresh',
        jti: 'test-jti',
      });
      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
      expect(response.body.message).toBe('Invalid refresh token.');
    });
  });

  describe('POST /v1/auth/refresh', () => {
    const dto = {
      name: 'John',
      email: 'john@example.com',
      password: 'Password123!',
      organizationName: 'An Corporation',
    };

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send(dto)
        .expect(201);
    });

    it('should logout successfully and revoke the refresh token', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: dto.email,
          password: dto.password,
        })
        .expect(201);
      const refreshToken = loginResponse.body.refreshToken;

      // Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({
          refreshToken,
        })
        .expect(200);
      expect(logoutResponse.body).toEqual({
        message: 'Logged out successfully.',
      });

      const refreshResponse = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(401);
      expect(refreshResponse.body.message).toBe(
        'Invalid or expired refresh token.',
      );
    });

    it('should return 401 when logging out with an invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token.');
    });

    it('should not allow a revoked refresh token to be used for refresh', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: dto.email,
          password: dto.password,
        })
        .expect(201);
      const refreshToken = loginResponse.body.refreshToken;

      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .send({
          refreshToken,
        })
        .expect(200);

      const response = await request(app.getHttpServer())
        .post('/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(401);
      expect(response.body.message).toBe('Invalid or expired refresh token.');
    });
  });
});
