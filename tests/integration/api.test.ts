import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestServer } from '../helpers/test-server';

describe('Credit Card API - Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestServer();
    await app.ready(); // Ensure all plugins are loaded
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Full Request/Response Cycle', () => {
    it('should handle complete GET request for credit card account', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
        headers: {
          accept: 'application/json',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body).toBeTruthy();
      expect(response.json()).toBeDefined();
    });

    it('should handle complete 404 flow', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/000000000000000',
        headers: {
          accept: 'application/json',
        },
      });

      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toContain('application/json');

      const body = response.json();
      expect(body.error).toBe('Not Found');
      expect(body.message).toBe('Credit card account not found');
    });
  });

  describe('Multiple Sequential Requests', () => {
    it('should handle multiple requests to same endpoint', async () => {
      const responses = await Promise.all([
        app.inject({ method: 'GET', url: '/credit-cards/001234567890123' }),
        app.inject({ method: 'GET', url: '/credit-cards/001234567890123' }),
        app.inject({ method: 'GET', url: '/credit-cards/001234567890123' }),
      ]);

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
          accountId: '001234567890123',
          totalBalance: 1250.75,
          membershipRewardPoints: 15420,
          paymentDueDate: '2025-08-15',
        });
      });
    });

    it('should handle requests to different accounts', async () => {
      const response1 = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      const response2 = await app.inject({
        method: 'GET',
        url: '/credit-cards/005555666677778',
      });

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);
      expect(response1.json().accountId).toBe('001234567890123');
      expect(response2.json().accountId).toBe('005555666677778');
    });
  });

  describe('HTTP Headers', () => {
    it('should set correct content-type header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle different accept headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          accept: '*/*',
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should include CORS headers when origin is present', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          origin: 'http://localhost:3001',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should return proper error for malformed URLs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/%%%invalid%%%',
      });

      // Should return 400 for validation error (invalid format)
      expect(response.statusCode).toBe(400);
    });

    it('should handle OPTIONS requests (CORS preflight)', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/credit-cards/001234567890123',
        headers: {
          origin: 'http://localhost:3001',
          'access-control-request-method': 'GET',
        },
      });

      expect([200, 204]).toContain(response.statusCode);
    });
  });

  describe('Swagger/OpenAPI Integration', () => {
    it('should serve Swagger UI at /docs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs',
      });

      expect([200, 302]).toContain(response.statusCode);
    });

    it('should serve OpenAPI JSON spec', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      expect(response.statusCode).toBe(200);
      const spec = response.json();
      expect(spec).toHaveProperty('openapi');
      expect(spec).toHaveProperty('paths');
    });

    it('should have correct paths in OpenAPI spec', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      const spec = response.json();
      expect(spec.paths).toHaveProperty('/credit-cards/{accountId}');
      expect(spec.paths).toHaveProperty('/health');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests correctly', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        method: 'GET',
        url: i % 2 === 0 ? '/credit-cards/001234567890123' : '/health',
      }));

      const responses = await Promise.all(
        requests.map((req) => app.inject(req as any))
      );

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('Response Validation', () => {
    it('should return valid JSON for all successful responses', async () => {
      const endpoints = [
        '/credit-cards/001234567890123',
        '/credit-cards/005555666677778',
        '/health',
      ];

      for (const endpoint of endpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
        });

        expect(response.statusCode).toBe(200);
        expect(() => JSON.parse(response.body)).not.toThrow();
      }
    });

    it('should return valid JSON for error responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/009999999999999',
      });

      // Should return 404 for valid format but non-existent account
      expect(response.statusCode).toBe(404);
      expect(() => JSON.parse(response.body)).not.toThrow();
    });
  });

  describe('Performance Checks', () => {
    it('should respond quickly to health checks', async () => {
      const start = Date.now();

      await app.inject({
        method: 'GET',
        url: '/health',
      });

      const duration = Date.now() - start;

      // Should respond in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid successive requests', async () => {
      const start = Date.now();

      await Promise.all(
        Array.from({ length: 50 }, () =>
          app.inject({ method: 'GET', url: '/health' })
        )
      );

      const duration = Date.now() - start;

      // 50 requests should complete in less than 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
