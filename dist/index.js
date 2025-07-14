"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const fs_1 = require("fs");
const path_1 = require("path");
const js_yaml_1 = __importDefault(require("js-yaml"));
const server = (0, fastify_1.default)({ logger: true });
const openApiSpec = js_yaml_1.default.load((0, fs_1.readFileSync)((0, path_1.join)(__dirname, '..', 'openapi.yaml'), 'utf8'));
server.register(cors_1.default, {
    origin: true,
});
server.register(swagger_1.default, {
    openapi: openApiSpec,
});
server.register(swagger_ui_1.default, {
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
const mockAccounts = {
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
server.get('/credit-cards/:accountId', async (request, reply) => {
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
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map