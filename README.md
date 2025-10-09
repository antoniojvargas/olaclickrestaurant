## 🍽️ Orders API — NestJS

API RESTful construida con NestJS para la gestión de órdenes de restaurante.
Permite crear órdenes, listar todas, obtener detalles por ID y avanzar el estado de una orden.
Incluye sanitización de entradas, validaciones y documentación interactiva con Swagger.

## 🚀 Tecnologías principales

* 🧱 NestJS — Framework backend progresivo para Node.js
* ⚙️ TypeScript — Tipado estático y mantenimiento seguro
* 🐘 PostgreSQL — Base de datos relacional
* 🧠 Redis — Cache / almacenamiento temporal
* 🐳 Docker Compose — Orquestación de contenedores
* 🧼 XSS Sanitization — Limpieza de entradas con xss
* 🧾 Swagger — Documentación interactiva

## Arquitectura de contenedores

El proyecto corre en 3 contenedores:

| Contenedor   | Descripción                 | Puerto |
| ------------ | --------------------------- | ------ |
| **backend**  | API NestJS                  | `3000` |
| **postgres** | Base de datos               | `5432` |
| **redis**    | Cache                       | `6379` |

## 🧩 Estructura del proyecto

```bash
src/
│
├── common/
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   │
│   ├── interceptors/
│   │   ├── error.interceptor.ts
│   │   ├── logging.interceptor.ts
│   │   └── transform-response.interceptor.ts
│   │
│   ├── logger/
│   │   └── winston.config.ts
│   │
│   └── pipes/
│       └── sanitize-input.pipe.ts
│
├── orders/
│   ├── constants/
│   │   └── cache-keys.ts
│   │
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   ├── order-item-response.dto.ts
│   │   └── order-response.dto.ts
│   │
│   ├── jobs/
│   │   └── orders-cleanup.job.ts
│   │
│   ├── repositories/
│   │   ├── order-items.repository.ts
│   │   ├── orders.repository.interface.ts
│   │   └── orders.repository.ts
│   │
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── entities/
│       ├── order.entity.ts
│       └── order-item.entity.ts
│
├── main.ts
└── app.module.ts
```

## ⚙️ Instalación y ejecución con Docker

1️⃣ Clonar el repositorio

```bash
git clone https://github.com/antoniojvargas/olaclickrestaurant.git
cd olaclickrestaurant
```

2️⃣ Crear archivo .env
```bash
# Puerto del backend
PORT=3000

# Base de datos PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=orders_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

3️⃣ Levantar los contenedores
```bash
docker compose up --build
```
Esto iniciará los tres contenedores:

backend, postgres, y redis.

Una vez todos estén levantados, podrás acceder a la API en:

👉 http://localhost:3000

## 📚 Documentación Swagger

Accede a la documentación interactiva en tu navegador:

👉 http://localhost:3000/api-docs

Podrás explorar y probar todos los endpoints directamente.

## 🧪 Ejecutando los tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e
```

## 🧠 Endpoints principales

### 🟢 Crear orden
POST `/orders`

Ejemplo:
```bash
curl --location 'http://localhost:3000/orders' \
--header 'Content-Type: application/json' \
--data '{
  "clientName": "Ana López",
  "items": [
    { "description": "Ceviche", "quantity": 2, "unitPrice": 50 },
    { "description": "Chicha morada", "quantity": 1, "unitPrice": 10 }
  ]
}'
```
Response:
```bash
{
  "clientName": "Ana López",
  "items": [
    { "description": "Ceviche", "quantity": 2, "unitPrice": 50 },
    { "description": "Chicha morada", "quantity": 1, "unitPrice": 10 }
  ]
}
```

### 🟣 Obtener todas las órdenes
GET `/orders`

Ejemplo:
```bash
curl --location 'http://localhost:3000/orders'
```
Response:
```bash
{
    "statusCode": 200,
    "message": "Data retrieved successfully from /orders",
    "data": [
        {
            "id": "869340f4-71b1-48b3-abce-42cfb8733f61",
            "clientName": "Ana López",
            "totalAmount": 110,
            "status": "initiated",
            "createdAt": "2025-10-09T18:18:07.724Z",
            "updatedAt": "2025-10-09T18:18:07.724Z",
            "items": [
                {
                    "id": "134b5e20-c7c9-4f73-a893-91797f2900f6",
                    "description": "Ceviche",
                    "quantity": 2,
                    "unitPrice": 50,
                    "orderId": "869340f4-71b1-48b3-abce-42cfb8733f61",
                    "createdAt": "2025-10-09T18:18:07.727Z",
                    "updatedAt": "2025-10-09T18:18:07.727Z"
                },
                {
                    "id": "08aca185-4190-4842-8dfd-c2df093c72ec",
                    "description": "Chicha morada",
                    "quantity": 1,
                    "unitPrice": 10,
                    "orderId": "869340f4-71b1-48b3-abce-42cfb8733f61",
                    "createdAt": "2025-10-09T18:18:07.727Z",
                    "updatedAt": "2025-10-09T18:18:07.727Z"
                }
            ]
        }
    ]
}
```

### 🔵 Obtener una orden por ID
GET `/orders/:id`

Ejemplo:
```bash
curl --location 'http://localhost:3000/orders/869340f4-71b1-48b3-abce-42cfb8733f61'
```

Response:
```bash
{
    "statusCode": 200,
    "message": "Data retrieved successfully from /orders/869340f4-71b1-48b3-abce-42cfb8733f61",
    "data": {
        "id": "869340f4-71b1-48b3-abce-42cfb8733f61",
        "clientName": "Ana López",
        "totalAmount": 110,
        "status": "initiated",
        "createdAt": "2025-10-09T18:18:07.724Z",
        "updatedAt": "2025-10-09T18:18:07.724Z",
        "items": [
            {
                "id": "134b5e20-c7c9-4f73-a893-91797f2900f6",
                "description": "Ceviche",
                "quantity": 2,
                "unitPrice": 50,
                "orderId": "869340f4-71b1-48b3-abce-42cfb8733f61",
                "createdAt": "2025-10-09T18:18:07.727Z",
                "updatedAt": "2025-10-09T18:18:07.727Z"
            },
            {
                "id": "08aca185-4190-4842-8dfd-c2df093c72ec",
                "description": "Chicha morada",
                "quantity": 1,
                "unitPrice": 10,
                "orderId": "869340f4-71b1-48b3-abce-42cfb8733f61",
                "createdAt": "2025-10-09T18:18:07.727Z",
                "updatedAt": "2025-10-09T18:18:07.727Z"
            }
        ]
    }
}
```

### 🟠 Avanzar estado de una orden
POST `/orders/:id/advance`

Ejemplo:
```bash
curl --location --request POST 'http://localhost:3000/orders/869340f4-71b1-48b3-abce-42cfb8733f61/advance'
```

Response:

```bash
{
    "statusCode": 201,
    "message": "Resource created successfully at /orders/869340f4-71b1-48b3-abce-42cfb8733f61/advance",
    "data": {
        "id": "869340f4-71b1-48b3-abce-42cfb8733f61",
        "clientName": "Ana López",
        "totalAmount": 110,
        "status": "sent",
        "createdAt": "2025-10-09T18:18:07.724Z",
        "updatedAt": "2025-10-09T20:30:28.741Z",
        "items": [
            {
                "id": "134b5e20-c7c9-4f73-a893-91797f2900f6",
                "description": "Ceviche",
                "quantity": 2,
                "unitPrice": 50,
                "orderId": "869340f4-71b1-48b3-abce-42cfb8733f61",
                "createdAt": "2025-10-09T18:18:07.727Z",
                "updatedAt": "2025-10-09T18:18:07.727Z"
            },
            {
                "id": "08aca185-4190-4842-8dfd-c2df093c72ec",
                "description": "Chicha morada",
                "quantity": 1,
                "unitPrice": 10,
                "orderId": "869340f4-71b1-48b3-abce-42cfb8733f61",
                "createdAt": "2025-10-09T18:18:07.727Z",
                "updatedAt": "2025-10-09T18:18:07.727Z"
            }
        ]
    }
}
```

## 🧰 Funcionalidades adicionales

### ✅ Sanitización de entradas

Cada request pasa por el pipe global SanitizeInputPipe, que limpia posibles inyecciones XSS antes de ser procesadas.

🧹 Jobs automáticos

El sistema ejecuta un cron job diario (orders-cleanup.job.ts) que elimina órdenes antiguas de más de 7 días.

⚙️ ConfigModule

Todas las variables de entorno son manejadas mediante @nestjs/config para mayor seguridad y flexibilidad.

### 🧾 Scripts útiles

| Comando               | Descripción                                  |
| --------------------- | -------------------------------------------- |
| `docker compose up`   | Levanta todos los contenedores               |
| `docker compose down` | Detiene y elimina los contenedores           |
| `npm run lint`        | Analiza el código con ESLint                 |

## 🧑‍💻 Autor

Antonio Vargas

📧 toyoyo600@gmail.com

🔗 [GitHub](https://github.com/antoniojvargas) | [LinkedIn](https://www.linkedin.com/in/antonio-vargas-82533526/)