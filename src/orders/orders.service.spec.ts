import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { OrdersService } from './orders.service';
import { ORDERS_REPOSITORY } from './repositories/orders.repository.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { CACHE_KEYS } from './constants/cache-keys';

describe('OrdersService', () => {
  let service: OrdersService;

  let mockOrdersRepository: any;

  let mockCacheManager: any;

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
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    const mockOrders: Order[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientName: 'Test Client',
        totalAmount: 100,
        status: 'initiated',
        items: [],
      } as unknown as Order,
    ];

    it('should return cached orders if available', async () => {
      mockCacheManager.get.mockResolvedValue(mockOrders);

      const result = await service.findAll();

      expect(result).toEqual(mockOrders);
      expect(mockCacheManager.get).toHaveBeenCalledWith(
        CACHE_KEYS.ORDERS_NOT_DELIVERED,
      );
      expect(mockOrdersRepository.findAllActive).not.toHaveBeenCalled();
    });

    it('should fetch from repository and cache if not cached', async () => {
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
        30 * 1000,
      );
    });
  });

  describe('findOne', () => {
    const orderId = '123e4567-e89b-12d3-a456-426614174000';
    const mockOrder: Order = {
      id: orderId,
      clientName: 'Test Client',
      totalAmount: 100,
      status: 'initiated',
      items: [],
    } as unknown as Order;

    it('should return an order if found', async () => {
      mockOrdersRepository.findById.mockResolvedValue(mockOrder);

      const result = await service.findOne(orderId);

      expect(result).toEqual(mockOrder);
      expect(mockOrdersRepository.findById).toHaveBeenCalledWith(orderId);
    });

    it('should throw NotFoundException if order not found', async () => {
      mockOrdersRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(orderId)).rejects.toThrow(NotFoundException);
      expect(mockOrdersRepository.findById).toHaveBeenCalledWith(orderId);
    });
  });

  describe('create', () => {
    const createOrderDto: CreateOrderDto = {
      clientName: 'Test Client',
      items: [
        {
          description: 'Test Item',
          quantity: 2,
          unitPrice: 50,
        },
      ],
    };

    const mockCreatedOrder: Order = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      clientName: 'Test Client',
      totalAmount: 100,
      status: 'initiated',
      items: [],
    } as unknown as Order;

    it('should create a new order', async () => {
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
          description: 'Test Item',
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

  describe('advanceStatus', () => {
    const orderId = '123e4567-e89b-12d3-a456-426614174000';

    it('should advance order from initiated to sent', async () => {
      const mockOrder: Order = {
        id: orderId,
        clientName: 'Test Client',
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

    it('should delete order when advancing from sent status', async () => {
      const mockOrder: Order = {
        id: orderId,
        clientName: 'Test Client',
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

    it('should delete order when it is already delivered', async () => {
      const mockOrder: Order = {
        id: orderId,
        clientName: 'Test Client',
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
