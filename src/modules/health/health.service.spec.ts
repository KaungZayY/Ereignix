import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { HealthService } from './health.service';

describe('UsersService', () => {
  let service: HealthService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    jest.clearAllMocks();
  });

  describe('getReadiness', () => {
    it('should return database up when query succeeds', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([1]);
      await expect(service.getReadiness()).resolves.toEqual({
        status: 'ok',
        checks: {
          database: 'up',
        },
      });
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });
  });

  it('should return database down when query fails', async () => {
    mockPrismaService.$queryRaw.mockRejectedValueOnce(
      new Error('Database unavailable'),
    );

    await expect(service.getReadiness()).resolves.toEqual({
      status: 'error',
      checks: {
        database: 'down',
      },
    });

    expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
  });

  describe('getLiveness', () => {
    it('should return ok status', () => {
      expect(service.getLiveness()).toEqual({
        status: 'ok',
      });
    });
  });
});
