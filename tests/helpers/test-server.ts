import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

export async function buildTestServer(): Promise<FastifyInstance> {
  const server = fastify({ logger: false }); // Disable logging in tests

  // Load OpenAPI specification from external file
  const openApiSpec = yaml.load(
    readFileSync(join(__dirname, '..', '..', 'openapi.yaml'), 'utf8')
  ) as object;

  // Register CORS
  await server.register(cors, {
    origin: true,
  });

  // Register Swagger with external OpenAPI spec
  await server.register(swagger, {
    openapi: openApiSpec,
  });

  // Register Swagger UI
  await server.register(swaggerUI, {
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

  // Validation schemas
  const accountIdParamSchema = {
    type: 'object',
    required: ['accountId'],
    properties: {
      accountId: {
        type: 'string',
        pattern: '^00[0-9]{13}$',
        description: 'Credit card account identifier (15 digits starting with 00)',
      },
    },
  } as const;

  // Routes
  server.get('/credit-cards/:accountId', {
    schema: {
      params: accountIdParamSchema,
      response: {
        200: {
          type: 'object',
          required: ['accountId', 'totalBalance', 'membershipRewardPoints', 'paymentDueDate'],
          properties: {
            accountId: { type: 'string', pattern: '^00[0-9]{13}$' },
            totalBalance: { type: 'number', minimum: 0 },
            membershipRewardPoints: { type: 'integer', minimum: 0 },
            paymentDueDate: { type: 'string', format: 'date' },
          },
        },
        404: {
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
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

  return server;
}
