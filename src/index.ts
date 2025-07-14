import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

const server = fastify({ logger: true });

// Register CORS
server.register(cors, {
  origin: true,
});

// Register Swagger
server.register(swagger, {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Credit Card Issuer API',
      description: 'API for managing credit card accounts',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
});

// Register Swagger UI
server.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false,
  },
  uiHooks: {
    onRequest: function (_request, _reply, next) {
      next();
    },
    preHandler: function (_request, _reply, next) {
      next();
    },
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  transformSpecification: (swaggerObject, _request, _reply) => {
    return swaggerObject;
  },
  transformSpecificationClone: true,
});

// Types
interface CreditCardAccount {
  accountId: string;
  totalBalance: number;
  membershipRewardPoints: number;
  paymentDueDate: string;
}

// Mock data
const mockAccounts: Record<string, CreditCardAccount> = {
  '001234567890123': {
    accountId: '001234567890123',
    totalBalance: 1250.75,
    membershipRewardPoints: 15420,
    paymentDueDate: '2025-08-15',
  },
  '005555666677778': {
    accountId: '005555666677778',
    totalBalance: 2847.33,
    membershipRewardPoints: 28750,
    paymentDueDate: '2025-08-22',
  },
};

// Routes
server.get(
  '/credit-cards/:accountId',
  {
    schema: {
      description: 'Get credit card account details',
      tags: ['Credit Cards'],
      params: {
        type: 'object',
        properties: {
          accountId: {
            type: 'string',
            description: 'Credit card account identifier',
            pattern: '^00[0-9]{13}$',
          },
        },
        required: ['accountId'],
      },
      response: {
        200: {
          description: 'Credit card account details',
          type: 'object',
          properties: {
            accountId: {
              type: 'string',
              description: 'Credit card account identifier',
            },
            totalBalance: {
              type: 'number',
              description: 'Current total balance on the account',
              minimum: 0,
            },
            membershipRewardPoints: {
              type: 'integer',
              description: 'Available membership reward points',
              minimum: 0,
            },
            paymentDueDate: {
              type: 'string',
              format: 'date',
              description: 'Next payment due date',
            },
          },
          required: ['accountId', 'totalBalance', 'membershipRewardPoints', 'paymentDueDate'],
        },
        404: {
          description: 'Account not found',
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  async (request, reply) => {
    const { accountId } = request.params as { accountId: string };

    const account = mockAccounts[accountId];

    if (!account) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Credit card account not found',
      });
    }

    return account;
  },
);

// Health check endpoint
server.get(
  '/health',
  {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          description: 'Service is healthy',
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  },
  async (_request, _reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  },
);

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3000');
    console.log('API Documentation available at http://localhost:3000/docs');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
