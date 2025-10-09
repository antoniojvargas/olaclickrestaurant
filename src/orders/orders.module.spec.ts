import { OrdersModule } from './orders.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { OrdersCleanupJob } from './jobs/orders-cleanup.job';
import { ORDERS_REPOSITORY } from './repositories/orders.repository.interface';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

// Mock SequelizeModule.forFeature
jest.mock('@nestjs/sequelize', () => ({
  SequelizeModule: {
    forFeature: jest.fn(() => ({
      module: class MockSequelizeFeatureModule {},
      providers: [],
      exports: [],
    })),
  },
  InjectModel: jest.fn(() => jest.fn()),
}));

// Mock ScheduleModule.forRoot
jest.mock('@nestjs/schedule', () => ({
  ScheduleModule: {
    forRoot: jest.fn(() => ({
      module: class MockScheduleModule {},
      providers: [],
      exports: [],
    })),
  },
  Cron: jest.fn(() => jest.fn()),
  CronExpression: {
    EVERY_DAY_AT_MIDNIGHT: '0 0 * * *',
    EVERY_HOUR: '0 * * * *',
    EVERY_MINUTE: '* * * * *',
  },
}));

// Mock WinstonModule
jest.mock('nest-winston', () => ({
  WinstonModule: {
    module: class MockWinstonModule {},
    providers: [],
    exports: [],
  },
  WINSTON_MODULE_NEST_PROVIDER: 'NestWinston',
}));

describe('OrdersModule', () => {
  it('should be defined', () => {
    expect(OrdersModule).toBeDefined();
  });

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', OrdersModule) || [];
    const providers = Reflect.getMetadata('providers', OrdersModule) || [];
    const exports = Reflect.getMetadata('exports', OrdersModule) || [];

    // Check that we have controllers
    expect(controllers).toContain(OrdersController);
    
    // Check that we have providers
    expect(providers).toContain(OrdersService);
    expect(providers).toContain(OrdersCleanupJob);
    
    // Check that ORDERS_REPOSITORY is exported
    expect(exports).toContain(ORDERS_REPOSITORY);
  });

  it('should configure SequelizeModule with correct entities', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SequelizeModule } = require('@nestjs/sequelize');
    expect(SequelizeModule.forFeature).toHaveBeenCalledWith([Order, OrderItem]);
  });

  it('should configure ScheduleModule', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ScheduleModule } = require('@nestjs/schedule');
    expect(ScheduleModule.forRoot).toHaveBeenCalled();
  });

  describe('Module Structure', () => {
    it('should have OrdersController as a controller', () => {
      const controllers =
        Reflect.getMetadata('controllers', OrdersModule) || [];
      expect(controllers).toContain(OrdersController);
    });

    it('should have OrdersService as a provider', () => {
      const providers = Reflect.getMetadata('providers', OrdersModule) || [];
      expect(providers).toContain(OrdersService);
    });

    it('should have OrdersCleanupJob as a provider', () => {
      const providers = Reflect.getMetadata('providers', OrdersModule) || [];
      expect(providers).toContain(OrdersCleanupJob);
    });

    it('should export ORDERS_REPOSITORY token', () => {
      const exports = Reflect.getMetadata('exports', OrdersModule) || [];
      expect(exports).toContain(ORDERS_REPOSITORY);
    });

    it('should provide ORDERS_REPOSITORY with OrdersRepository implementation', () => {
      const providers = Reflect.getMetadata('providers', OrdersModule) || [];
      const repositoryProvider = providers.find(
        (p) => typeof p === 'object' && p.provide === ORDERS_REPOSITORY,
      );
      expect(repositoryProvider).toBeDefined();
      expect(repositoryProvider.useClass).toBe(OrdersRepository);
    });
  });
});
