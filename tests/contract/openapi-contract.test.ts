import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestServer } from '../helpers/test-server';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

describe('OpenAPI Contract Tests', () => {
  let app: FastifyInstance;
  let openApiSpec: any;
  let ajv: Ajv;

  beforeAll(async () => {
    app = await buildTestServer();
    await app.ready();

    // Load OpenAPI spec
    openApiSpec = yaml.load(
      readFileSync(join(__dirname, '..', '..', 'openapi.yaml'), 'utf8')
    ) as any;

    // Setup AJV with OpenAPI formats
    ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /credit-cards/{accountId} - Success Response', () => {
    it('should match OpenAPI schema for 200 response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      expect(response.statusCode).toBe(200);

      const schema =
        openApiSpec.components.schemas.CreditCardAccount;
      const validate = ajv.compile(schema);
      const body = response.json();

      const valid = validate(body);
      if (!valid) {
        console.error('Validation errors:', validate.errors);
      }
      expect(valid).toBe(true);
    });

    it('should have all required fields per OpenAPI spec', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      const body = response.json();
      const schema = openApiSpec.components.schemas.CreditCardAccount;

      // Check all required fields are present
      schema.required.forEach((field: string) => {
        expect(body).toHaveProperty(field);
      });
    });

    it('should match field types defined in OpenAPI spec', async () => {
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

    it('should validate accountId pattern from OpenAPI spec', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      const body = response.json();
      const pattern = /^00[0-9]{13}$/;

      expect(body.accountId).toMatch(pattern);
    });

    it('should validate totalBalance constraints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      const body = response.json();

      // totalBalance should be >= 0 per OpenAPI spec
      expect(body.totalBalance).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(body.totalBalance)).toBe(true);
    });

    it('should validate membershipRewardPoints constraints', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      const body = response.json();

      // membershipRewardPoints should be integer >= 0
      expect(body.membershipRewardPoints).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(body.membershipRewardPoints)).toBe(true);
    });

    it('should validate paymentDueDate format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      const body = response.json();

      // Should match YYYY-MM-DD format
      expect(body.paymentDueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Should be a valid date
      const date = new Date(body.paymentDueDate);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).not.toBeNaN();
    });

    it('should match example from OpenAPI spec', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      const body = response.json();
      const example = openApiSpec.components.schemas.CreditCardAccount.example;

      // Structure should match
      expect(Object.keys(body).sort()).toEqual(Object.keys(example).sort());
    });
  });

  describe('GET /credit-cards/{accountId} - Error Response', () => {
    it('should match OpenAPI schema for 404 response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/009999999999999',
      });

      expect(response.statusCode).toBe(404);

      const schema = openApiSpec.components.schemas.ErrorResponse;
      const validate = ajv.compile(schema);
      const body = response.json();

      const valid = validate(body);
      if (!valid) {
        console.error('Validation errors:', validate.errors);
      }
      expect(valid).toBe(true);
    });

    it('should have required error fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/009999999999999',
      });

      const body = response.json();
      const schema = openApiSpec.components.schemas.ErrorResponse;

      schema.required.forEach((field: string) => {
        expect(body).toHaveProperty(field);
      });
    });

    it('should match error response structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/009999999999999',
      });

      const body = response.json();

      expect(typeof body.error).toBe('string');
      expect(typeof body.message).toBe('string');
      expect(body.error.length).toBeGreaterThan(0);
      expect(body.message.length).toBeGreaterThan(0);
    });
  });

  describe('GET /health - Health Response', () => {
    it('should match OpenAPI schema for health response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const schema = openApiSpec.components.schemas.HealthResponse;
      const validate = ajv.compile(schema);
      const body = response.json();

      const valid = validate(body);
      if (!valid) {
        console.error('Validation errors:', validate.errors);
      }
      expect(valid).toBe(true);
    });

    it('should have all required health fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = response.json();
      const schema = openApiSpec.components.schemas.HealthResponse;

      schema.required.forEach((field: string) => {
        expect(body).toHaveProperty(field);
      });
    });

    it('should validate status enum value', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = response.json();
      const validStatuses = ['healthy', 'unhealthy'];

      expect(validStatuses).toContain(body.status);
    });

    it('should validate timestamp format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = response.json();

      // Should be ISO 8601 date-time format
      const timestamp = new Date(body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Response Content-Type', () => {
    it('should return application/json for all endpoints', async () => {
      const endpoints = [
        '/credit-cards/001234567890123',
        '/health',
      ];

      for (const endpoint of endpoints) {
        const response = await app.inject({
          method: 'GET',
          url: endpoint,
        });

        expect(response.headers['content-type']).toContain('application/json');
      }
    });
  });

  describe('OpenAPI Metadata Validation', () => {
    it('should have required OpenAPI info fields', () => {
      expect(openApiSpec.info).toHaveProperty('title');
      expect(openApiSpec.info).toHaveProperty('version');
      expect(openApiSpec.info).toHaveProperty('description');
    });

    it('should have contact information', () => {
      expect(openApiSpec.info).toHaveProperty('contact');
      expect(openApiSpec.info.contact).toHaveProperty('name');
      expect(openApiSpec.info.contact).toHaveProperty('email');
    });

    it('should have license information', () => {
      expect(openApiSpec.info).toHaveProperty('license');
      expect(openApiSpec.info.license).toHaveProperty('name');
    });

    it('should define all referenced endpoints', () => {
      expect(openApiSpec.paths).toHaveProperty('/credit-cards/{accountId}');
      expect(openApiSpec.paths).toHaveProperty('/health');
    });

    it('should have operation IDs for all endpoints', () => {
      const creditCardOp = openApiSpec.paths['/credit-cards/{accountId}'].get;
      const healthOp = openApiSpec.paths['/health'].get;

      expect(creditCardOp).toHaveProperty('operationId');
      expect(healthOp).toHaveProperty('operationId');
      expect(creditCardOp.operationId).toBe('getCreditCardAccount');
      expect(healthOp.operationId).toBe('healthCheck');
    });

    it('should have tags for all operations', () => {
      const creditCardOp = openApiSpec.paths['/credit-cards/{accountId}'].get;
      const healthOp = openApiSpec.paths['/health'].get;

      expect(creditCardOp).toHaveProperty('tags');
      expect(healthOp).toHaveProperty('tags');
      expect(creditCardOp.tags.length).toBeGreaterThan(0);
      expect(healthOp.tags.length).toBeGreaterThan(0);
    });
  });

  describe('Response Examples Validation', () => {
    it('should validate that actual responses match OpenAPI examples', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/credit-cards/001234567890123',
      });

      const body = response.json();
      const example = openApiSpec.components.schemas.CreditCardAccount.example;

      // Types should match
      expect(typeof body.accountId).toBe(typeof example.accountId);
      expect(typeof body.totalBalance).toBe(typeof example.totalBalance);
      expect(typeof body.membershipRewardPoints).toBe(
        typeof example.membershipRewardPoints
      );
      expect(typeof body.paymentDueDate).toBe(typeof example.paymentDueDate);
    });
  });
});
