import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  const healthServiceMock = {
    getLiveness: jest.fn(),
    getReadiness: jest.fn(),
  };

  const loggerMock = {
    setContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthServiceMock,
        },
        {
          provide: PinoLogger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);

    jest.clearAllMocks();
  });

  describe('getLiveness', () => {
    it('should return the liveness response from the service', () => {
      const response = { status: 'ok' };

      healthServiceMock.getLiveness.mockReturnValue(response);

      expect(controller.getLiveness()).toEqual(response);
      expect(healthServiceMock.getLiveness).toHaveBeenCalledTimes(1);
    });
  });

  describe('getReadiness', () => {
    it('should return the readiness response from the service', async () => {
      const response = {
        status: 'ok',
        checks: {
          database: 'up',
        },
      };

      healthServiceMock.getReadiness.mockResolvedValue(response);

      await expect(controller.getReadiness()).resolves.toEqual(response);
      expect(healthServiceMock.getReadiness).toHaveBeenCalledTimes(1);
    });
  });
});
