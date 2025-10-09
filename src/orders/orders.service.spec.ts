import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { OrdersService } from './orders.service';
import { ORDERS_REPOSITORY } from './repositories/orders.repository.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { CACHE_KEYS } from './constants/cache-keys';

describe('OrdersService', () => {
  let service: OrdersService;
  let mockOrdersRepository: any;
  let mockCacheManager: any;
  let mockLogger: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockOrdersRepository = {
      findAllActive: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      createItems: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(30), // Valor por defecto de CACHE_TTL
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: ORDERS_REPOSITORY,
          useValue: mockOrdersRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  // 🔍 Pruebas de findAll
  describe('findAll', () => {
    const mockOrders: Order[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientName: 'Cliente de Prueba',
        totalAmount: 100,
        status: 'initiated',
        items: [],
      } as unknown as Order,
    ];

    it('debería retornar las órdenes cacheadas si están disponibles', async () => {
      mockCacheManager.get.mockResolvedValue(mockOrders);

      const result = await service.findAll();

      expect(result).toEqual(mockOrders);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        CACHE_KEYS.ORDERS_NOT_DELIVERED,
      );
      expect(mockOrdersRepository.findAllActive).not.toHaveBeenCalled();
    });

    it('debería obtener las órdenes del repositorio y guardarlas en cache si no están cacheadas', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockOrdersRepository.findAllActive.mockResolvedValue(mockOrders);

      const result = await service.findAll();

      expect(result).toEqual(mockOrders);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        CACHE_KEYS.ORDERS_NOT_DELIVERED,
      );
      expect(mockOrdersRepository.findAllActive).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        CACHE_KEYS.ORDERS_NOT_DELIVERED,
        mockOrders,
        30 * 1000, // TTL de 30 segundos desde config
      );
    });
  });

  // 🔍 Pruebas de findOne
  describe('findOne', () => {
    const orderId = '123e4567-e89b-12d3-a456-426614174000';
    const mockOrder: Order = {
      id: orderId,
      clientName: 'Cliente de Prueba',
      totalAmount: 100,
      status: 'initiated',
      items: [],
    } as unknown as Order;

    it('debería retornar la orden si existe', async () => {
      mockOrdersRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.findOne(orderId);

      expect(result).toEqual(mockOrder);
      expect(mockOrdersRepository.findById).toHaveBeenCalledWith(orderId);
    });

    it('debería lanzar NotFoundException si la orden no existe', async () => {
      mockOrdersRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(orderId)).rejects.toThrow(NotFoundException);
      expect(mockOrdersRepository.findById).toHaveBeenCalledWith(orderId);
    });
  });

  // 🧾 Pruebas de create
  describe('create', () => {
    const createOrderDto: CreateOrderDto = {
      clientName: 'Cliente de Prueba',
      items: [
        {
          description: 'Artículo de Prueba',
          quantity: 2,
          unitPrice: 50,
        },
      ],
    };

    const mockCreatedOrder: Order = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      clientName: 'Cliente de Prueba',
      totalAmount: 100,
      status: 'initiated',
      items: [],
    } as unknown as Order;

    it('debería crear una nueva orden', async () => {
      mockOrdersRepository.create.mockResolvedValue(mockCreatedOrder);
      mockOrdersRepository.createItems.mockResolvedValue([]);
      mockOrdersRepository.findById.mockResolvedValue(mockCreatedOrder);

      const result = await service.create(createOrderDto);

      expect(result).toEqual(mockCreatedOrder);
      expect(mockOrdersRepository.create).toHaveBeenCalledWith({
        clientName: createOrderDto.clientName,
        totalAmount: 100,
        status: 'initiated',
      });
      expect(mockOrdersRepository.createItems).toHaveBeenCalledWith([
        {
          description: 'Artículo de Prueba',
          quantity: 2,
          unitPrice: 50,
          orderId: mockCreatedOrder.id,
        },
      ]);
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.ORDERS_NOT_DELIVERED,
      );
    });
  });

  // ⏩ Pruebas de advanceStatus
  describe('advanceStatus', () => {
    const orderId = '123e4567-e89b-12d3-a456-426614174000';

    it('debería avanzar la orden de "initiated" a "sent"', async () => {
      const mockOrder: Order = {
        id: orderId,
        clientName: 'Cliente de Prueba',
        totalAmount: 100,
        status: 'initiated',
        items: [],
      } as unknown as Order;

      mockOrdersRepository.findById.mockResolvedValue(mockOrder);
      mockOrdersRepository.update.mockResolvedValue(mockOrder);

      await service.advanceStatus(orderId);

      expect(mockOrdersRepository.update).toHaveBeenCalledWith(mockOrder, {
        status: 'sent',
      });
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.ORDERS_NOT_DELIVERED,
      );
    });

    it('debería eliminar la orden al avanzar desde estado "sent"', async () => {
      const mockOrder: Order = {
        id: orderId,
        clientName: 'Cliente de Prueba',
        totalAmount: 100,
        status: 'sent',
        items: [],
      } as unknown as Order;

      mockOrdersRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.advanceStatus(orderId);

      expect(mockOrdersRepository.delete).toHaveBeenCalledWith(mockOrder);
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.ORDERS_NOT_DELIVERED,
      );
      expect(result).toEqual({
        message: `Order ${orderId} has been delivered and removed.`,
      });
    });

    it('debería eliminar la orden si ya está entregada', async () => {
      const mockOrder: Order = {
        id: orderId,
        clientName: 'Cliente de Prueba',
        totalAmount: 100,
        status: 'delivered',
        items: [],
      } as unknown as Order;

      mockOrdersRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.advanceStatus(orderId);

      expect(mockOrdersRepository.delete).toHaveBeenCalledWith(mockOrder);
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.ORDERS_NOT_DELIVERED,
      );
      expect(result).toEqual({
        message: `Order ${orderId} has been delivered and removed.`,
      });
    });
  });
});
