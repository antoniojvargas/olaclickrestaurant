import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

describe('OrdersController', () => {
  let controller: OrdersController;

  const mockOrdersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    advanceStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all orders', async () => {
      const mockOrders: Order[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          clientName: 'Test Client',
          totalAmount: 100,
          status: 'initiated',
          items: [],
        } as unknown as Order,
      ];

      mockOrdersService.findAll.mockResolvedValue(mockOrders);

      const result = await controller.findAll();

      expect(result).toEqual(mockOrders);
      expect(mockOrdersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single order', async () => {
      const mockOrder: Order = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientName: 'Test Client',
        totalAmount: 100,
        status: 'initiated',
        items: [],
      } as unknown as Order;

      const orderId = '123e4567-e89b-12d3-a456-426614174000';
      mockOrdersService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne(orderId);

      expect(result).toEqual(mockOrder);
      expect(mockOrdersService.findOne).toHaveBeenCalledWith(orderId);
    });
  });

  describe('create', () => {
    it('should create a new order', async () => {
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
        clientName: createOrderDto.clientName,
        totalAmount: 100,
        status: 'initiated',
        items: [],
      } as unknown as Order;

      mockOrdersService.create.mockResolvedValue(mockCreatedOrder);

      const result = await controller.create(createOrderDto);

      expect(result).toEqual(mockCreatedOrder);
      expect(mockOrdersService.create).toHaveBeenCalledWith(createOrderDto);
    });
  });

  describe('advanceStatus', () => {
    it('should advance order status', async () => {
      const orderId = '123e4567-e89b-12d3-a456-426614174000';
      const mockAdvancedOrder: Order = {
        id: orderId,
        clientName: 'Test Client',
        totalAmount: 100,
        status: 'sent',
        items: [],
      } as unknown as Order;

      mockOrdersService.advanceStatus.mockResolvedValue(mockAdvancedOrder);

      const result = await controller.advanceStatus(orderId);

      expect(result).toEqual(mockAdvancedOrder);
      expect(mockOrdersService.advanceStatus).toHaveBeenCalledWith(orderId);
    });
  });
});
