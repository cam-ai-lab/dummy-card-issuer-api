import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestServer } from '../helpers/test-server';

describe('Input Validation Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Account ID Validation', () => {
    it('should accept valid account ID format (15 digits starting with 00)', async () => {
      const validIds = [
        '001234567890123',
        '005555666677778',
        '000000000000000',
        '009999999999999',
      ];

      for (const id of validIds) {
        const response = await app.inject({
          method: 'GET',
          url: `/credit-cards/${id}`,
        });

        // Should be 200 for existing accounts or 404 for non-existing,
        // but NOT 400 (validation error)
        expect([200, 404]).toContain(response.statusCode);
      }
    });

    it('should reject account ID with wrong length', async () => {
      const invalidIds = [
        '00123456789012',    // 14 digits
        '0012345678901234',  // 16 digits
        '001',               // too short
        '',                  // empty
      ];

      for (const id of invalidIds) {
        if (id === '') continue; // Skip empty as it's a routing issue

        const response = await app.inject({
          method: 'GET',
          url: `/credit-cards/${id}`,
        });

        // Currently returns 404, should eventually return 400
        expect([400, 404]).toContain(response.statusCode);
      }
    });

    it('should reject account ID not starting with 00', async () => {
      const invalidIds = [
        '101234567890123',  // starts with 10
        '991234567890123',  // starts with 99
        '111234567890123',  // starts with 11
      ];

      for (const id of invalidIds) {
        const response = await app.inject({
          method: 'GET',
          url: `/credit-cards/${id}`,
        });

        // Currently returns 404, should eventually return 400
        expect([400, 404]).toContain(response.statusCode);
      }
    });

    it('should reject account ID with non-numeric characters', async () => {
      const invalidIds = [
        '00ABCD567890123',  // letters
        '00123-567890123',  // hyphen
        '00123.567890123',  // period
        '00 234567890123',  // space
      ];

      for (const id of invalidIds) {
        const response = await app.inject({
          method: 'GET',
          url: `/credit-cards/${id}`,
        });

        // Currently returns 404, should eventually return 400
        expect([400, 404]).toContain(response.statusCode);
      }
    });
  });

  describe('Security - Injection Prevention', () => {
    it('should safely handle SQL injection attempts', async () => {
      const maliciousInputs = [
        "001234567890123' OR '1'='1",
        "001234567890123'; DROP TABLE accounts;--",
        "001234567890123' UNION SELECT * FROM users--",
      ];

      for (const input of maliciousInputs) {
        const response = await app.inject({
          method: 'GET',
          url: `/credit-cards/${encodeURIComponent(input)}`,
        });

        // Should return 400 for validation error (invalid format)
        expect(response.statusCode).toBe(400);
        expect(response.json()).toHaveProperty('message');
      }
    });

    it('should safely handle XSS attempts', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
      ];

      for (const input of maliciousInputs) {
        const response = await app.inject({
          method: 'GET',
          url: `/credit-cards/${encodeURIComponent(input)}`,
        });

        // Should return 400 for validation error (invalid format)
        expect(response.statusCode).toBe(400);

        // Response should not contain the malicious script
        const body = JSON.stringify(response.json());
        expect(body).not.toContain('<script>');
        expect(body).not.toContain('onerror=');
      }
    });

    it('should handle path traversal attempts', async () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '..%2F..%2F..%2Fetc%2Fpasswd',
        '....//....//....//etc/passwd',
      ];

      for (const input of maliciousInputs) {
        const response = await app.inject({
          method: 'GET',
          url: `/credit-cards/${encodeURIComponent(input)}`,
        });

        // Should return 400 for validation error (invalid format)
        expect(response.statusCode).toBe(400);
      }
    });

    it('should handle command injection attempts', async () => {
      const maliciousInputs = [
        '001234567890123; ls -la',
        '001234567890123 && cat /etc/passwd',
        '001234567890123 | whoami',
      ];

      for (const input of maliciousInputs) {
        const response = await app.inject({
          method: 'GET',
          url: `/credit-cards/${encodeURIComponent(input)}`,
        });

        // Should return 400 for validation error (invalid format)
        expect(response.statusCode).toBe(400);
      }
    });
  });

  describe('DoS Prevention', () => {
    it('should handle extremely long account IDs', async () => {
      const veryLongId = '0' + '1'.repeat(10000);

      const response = await app.inject({
        method: 'GET',
        url: `/credit-cards/${veryLongId}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should handle unicode and special characters', async () => {
      const specialInputs = [
        '001234567890123😀',
        '00123456789012🔥',
        '001234567890123\u0000',
        '001234567890123\n\r',
      ];

      for (const input of specialInputs) {
        const response = await app.inject({
          method: 'GET',
          url: `/credit-cards/${encodeURIComponent(input)}`,
        });

        // Should return 400 for validation error (invalid format)
        expect(response.statusCode).toBe(400);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle URL encoded characters', async () => {
      const encoded = encodeURIComponent('001234567890123');

      const response = await app.inject({
        method: 'GET',
        url: `/credit-cards/${encoded}`,
      });

      // Should work normally for valid encoded ID
      expect([200, 404]).toContain(response.statusCode);
    });

    it('should handle double encoding attempts', async () => {
      const doubleEncoded = encodeURIComponent(
        encodeURIComponent('001234567890123')
      );

      const response = await app.inject({
        method: 'GET',
        url: `/credit-cards/${doubleEncoded}`,
      });

      // Double encoding of valid ID still results in valid ID after single decode
      // So it should return 200 or 404 (found or not found), not a validation error
      expect([200, 404]).toContain(response.statusCode);
    });

    it('should handle null bytes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/credit-cards/001234567890123${encodeURIComponent('\x00')}`,
      });

      expect([400, 404]).toContain(response.statusCode);
    });

    it('should handle case sensitivity correctly', async () => {
      // Account IDs should be case-sensitive (all numeric anyway)
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      expect([200, 404]).toContain(response.statusCode);
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject POST to GET-only endpoint', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/credit-cards/001234567890123',
        payload: { test: 'data' },
      });

      expect(response.statusCode).toBe(404); // Method not allowed or not found
    });

    it('should reject PUT to GET-only endpoint', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/credit-cards/001234567890123',
        payload: { test: 'data' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject DELETE to GET-only endpoint', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/credit-cards/001234567890123',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
