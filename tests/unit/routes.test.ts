import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestServer } from '../helpers/test-server';

describe('Credit Card API - Unit Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /credit-cards/:accountId', () => {
    it('should return account details for valid accountId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const body = response.json();
      expect(body).toEqual({
        accountId: '001234567890123',
        totalBalance: 1250.75,
        membershipRewardPoints: 15420,
        paymentDueDate: '2025-08-15',
      });
    });

    it('should return correct data types', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      const body = response.json();
      expect(typeof body.accountId).toBe('string');
      expect(typeof body.totalBalance).toBe('number');
      expect(typeof body.membershipRewardPoints).toBe('number');
      expect(typeof body.paymentDueDate).toBe('string');
    });

    it('should return second account details correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/005555666677778',
      });

      expect(response.statusCode).toBe(200);

      const body = response.json();
      expect(body).toEqual({
        accountId: '005555666677778',
        totalBalance: 2847.33,
        membershipRewardPoints: 28750,
        paymentDueDate: '2025-08-22',
      });
    });

    it('should return 404 for non-existent account', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/009999999999999',
      });

      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toContain('application/json');

      const body = response.json();
      expect(body).toHaveProperty('error', 'Not Found');
      expect(body).toHaveProperty('message', 'Credit card account not found');
    });

    it('should handle invalid account ID gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/invalid-id',
      });

      // Should return 400 for validation error (doesn't match pattern)
      expect(response.statusCode).toBe(400);
    });

    it('should handle empty account ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/',
      });

      // Fastify will return 400 for validation error or 404 for route not found
      expect([400, 404]).toContain(response.statusCode);
    });

    it('should handle SQL injection attempts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123\' OR \'1\'=\'1',
      });

      // Should return 400 for validation error (invalid format)
      expect(response.statusCode).toBe(400);
    });

    it('should handle special characters in account ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/<script>alert("xss")</script>',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle very long account IDs', async () => {
      const longId = '0'.repeat(1000);
      const response = await app.inject({
        method: 'GET',
        url: `/credit-cards/${longId}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const body = response.json();
      expect(body).toHaveProperty('status', 'healthy');
      expect(body).toHaveProperty('timestamp');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = response.json();
      const timestamp = new Date(body.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return current timestamp', async () => {
      const before = new Date();

      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const after = new Date();
      const body = response.json();
      const timestamp = new Date(body.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have correct response structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = response.json();
      expect(Object.keys(body).sort()).toEqual(['status', 'timestamp'].sort());
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          origin: 'http://example.com',
        },
      });

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Non-existent Routes', () => {
    it('should return 404 for non-existent route', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/non-existent',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 for wrong HTTP method', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/health',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
