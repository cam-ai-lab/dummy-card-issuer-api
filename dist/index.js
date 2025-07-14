"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const server = (0, fastify_1.default)({ logger: true });
server.register(cors_1.default, {
    origin: true,
});
server.register(swagger_1.default, {
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
server.register(swagger_ui_1.default, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
    },
    uiHooks: {
        onRequest: function (_request, _reply, next) { next(); },
        preHandler: function (_request, _reply, next) { next(); },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, _request, _reply) => { return swaggerObject; },
    transformSpecificationClone: true,
});
const mockAccounts = {
    '4532-1234-5678-9012': {
        accountId: '4532-1234-5678-9012',
        totalBalance: 1250.75,
        membershipRewardPoints: 15420,
        paymentDueDate: '2025-08-15',
    },
    '5555-6666-7777-8888': {
        accountId: '5555-6666-7777-8888',
        totalBalance: 2847.33,
        membershipRewardPoints: 28750,
        paymentDueDate: '2025-08-22',
    },
};
server.get('/credit-cards/:accountId', {
    schema: {
        description: 'Get credit card account details',
        tags: ['Credit Cards'],
        params: {
            type: 'object',
            properties: {
                accountId: {
                    type: 'string',
                    description: 'Credit card account identifier',
                    pattern: '^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}$',
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
}, async (request, reply) => {
    const { accountId } = request.params;
    const account = mockAccounts[accountId];
    if (!account) {
        return reply.code(404).send({
            error: 'Not Found',
            message: 'Credit card account not found',
        });
    }
    return account;
});
server.get('/health', {
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
}, async (_request, _reply) => {
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
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map