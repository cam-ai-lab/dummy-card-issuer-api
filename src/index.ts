import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const server = fastify({ logger: true });

// Load OpenAPI specification from external file
const openApiSpec = yaml.load(
  readFileSync(join(process.cwd(), 'openapi.yaml'), 'utf8'),
) as object;

// Register CORS
server.register(cors, {
  origin: true,
});

// Register Swagger with external OpenAPI spec
server.register(swagger, {
  openapi: openApiSpec,
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
server.get('/credit-cards/:accountId', async (request, reply) => {
  const { accountId } = request.params as { accountId: string };

  const account = mockAccounts[accountId];

  if (!account) {
    return reply.code(404).send({
      error: 'Not Found',
      message: 'Credit card account not found',
    });
  }

  return account;
});

// Health check endpoint
server.get('/health', async (_request, _reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  };
});

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
