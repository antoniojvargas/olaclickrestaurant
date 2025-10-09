import { OrdersModule } from './orders.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './repositories/orders.repository';
import { OrdersCleanupJob } from './jobs/orders-cleanup.job';
import { ORDERS_REPOSITORY } from './repositories/orders.repository.interface';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

// Mock de SequelizeModule.forFeature
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

// Mock de ScheduleModule.forRoot
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

// Mock de WinstonModule
jest.mock('nest-winston', () => ({
  WinstonModule: {
    module: class MockWinstonModule {},
    providers: [],
    exports: [],
  },
  WINSTON_MODULE_NEST_PROVIDER: 'NestWinston',
}));

describe('OrdersModule', () => {
  it('debería estar definido', () => {
    expect(OrdersModule).toBeDefined();
  });

  it('debería tener la metadata correcta del módulo', () => {
    const controllers = Reflect.getMetadata('controllers', OrdersModule) || [];
    const providers = Reflect.getMetadata('providers', OrdersModule) || [];
    const exports = Reflect.getMetadata('exports', OrdersModule) || [];

    // Verifica que tengamos controladores
    expect(controllers).toContain(OrdersController);

    // Verifica que tengamos proveedores
    expect(providers).toContain(OrdersService);
    expect(providers).toContain(OrdersCleanupJob);

    // Verifica que ORDERS_REPOSITORY esté exportado
    expect(exports).toContain(ORDERS_REPOSITORY);
  });

  it('debería configurar SequelizeModule con las entidades correctas', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SequelizeModule } = require('@nestjs/sequelize');
    expect(SequelizeModule.forFeature).toHaveBeenCalledWith([Order, OrderItem]);
  });

  it('debería configurar ScheduleModule', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ScheduleModule } = require('@nestjs/schedule');
    expect(ScheduleModule.forRoot).toHaveBeenCalled();
  });

  describe('Estructura del módulo', () => {
    it('debería tener OrdersController como controlador', () => {
      const controllers =
        Reflect.getMetadata('controllers', OrdersModule) || [];
      expect(controllers).toContain(OrdersController);
    });

    it('debería tener OrdersService como proveedor', () => {
      const providers = Reflect.getMetadata('providers', OrdersModule) || [];
      expect(providers).toContain(OrdersService);
    });

    it('debería tener OrdersCleanupJob como proveedor', () => {
      const providers = Reflect.getMetadata('providers', OrdersModule) || [];
      expect(providers).toContain(OrdersCleanupJob);
    });

    it('debería exportar el token ORDERS_REPOSITORY', () => {
      const exports = Reflect.getMetadata('exports', OrdersModule) || [];
      expect(exports).toContain(ORDERS_REPOSITORY);
    });

    it('debería proveer ORDERS_REPOSITORY con la implementación OrdersRepository', () => {
      const providers = Reflect.getMetadata('providers', OrdersModule) || [];
      const repositoryProvider = providers.find(
        (p) => typeof p === 'object' && p.provide === ORDERS_REPOSITORY,
      );
      expect(repositoryProvider).toBeDefined();
      expect(repositoryProvider.useClass).toBe(OrdersRepository);
    });
  });
});
