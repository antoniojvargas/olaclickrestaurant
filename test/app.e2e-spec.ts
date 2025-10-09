import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Sequelize } from 'sequelize-typescript';
import { OrdersService } from '../src/orders/orders.service';

jest.setTimeout(20000); 

describe('Orders API (e2e)', () => {
  let app: INestApplication;
  let sequelize: Sequelize;
  let ordersService: OrdersService;
  let createdOrderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    sequelize = moduleFixture.get(Sequelize);
    ordersService = moduleFixture.get(OrdersService);
  });

  beforeEach(async () => {
    // 🧹 Limpia todas las tablas antes de cada test
    await sequelize.truncate({ cascade: true });
  });

  afterAll(async () => {
    await app.close();
  });

  // 🧪 Test: Crear una orden
  it('/orders (POST) ➜ should create a new order', async () => {
    const createOrderDto = {
      clientName: 'Juan Perez',
      items: [
        {
          description: 'Chicharron',
          unitPrice: 10.5,
          quantity: 2,
        },
        {
          description: 'Papelon',
          unitPrice: 2.5,
          quantity: 1,
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/orders')
      .send(createOrderDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.clientName).toBe('Juan Perez');
    expect(response.body.totalAmount).toBe(23.5);
  });

  // 🧪 Test: Obtener una orden por ID
  it('/orders/:id (GET) ➜ should retrieve an existing order', async () => {
    const created = await ordersService.create({
      clientName: 'Juan Perez',
      items: [
        {
          description: 'Chicharron',
          unitPrice: 10.5,
          quantity: 2,
        },
        {
          description: 'Papelon',
          unitPrice: 2.5,
          quantity: 1,
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get(`/orders/${created.id}`)
      .expect(200);

    expect(response.body.id).toBe(created.dataValues.id);
    expect(response.body.clientName).toBe('Juan Perez');
  });

  // 🧪 Test: Avanzar el estado de una orden
  it('/orders/:id/advance (POST) ➜ should advance order status', async () => {
    const created = await ordersService.create({
      clientName: 'Mario',
      items: [{ description: 'Cachapa', unitPrice: 12, quantity: 1 }],
    });

    const response = await request(app.getHttpServer())
      .post(`/orders/${created.id}/advance`)
      .expect(201);

    expect(response.body.id).toBe(created.dataValues.id);
    expect(response.body.status).toBe('sent');
  });

  // 🧪 Test: Obtener todas las órdenes
  it('/orders (GET) ➜ should return all active orders', async () => {
    await ordersService.create({
      clientName: 'Alice',
      items: [{ description: 'Chicharron', quantity: 1, unitPrice: 10 }],
    });

    const response = await request(app.getHttpServer())
      .get('/orders')
      .expect(200);

    expect(response.body.length).toBe(1);
    expect(response.body[0].clientName).toBe('Alice');
  });
});
