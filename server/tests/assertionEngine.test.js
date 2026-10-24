import { describe, it, expect } from 'vitest';
import { evaluateAssertions, getNestedValue } from '../src/services/assertionEngine.js';

describe('Rule-Based Assertion Engine', () => {
  const sampleResponse = {
    statusCode: 200,
    durationMs: 85,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-custom-header': 'APIForge-Test',
    },
    body: {
      success: true,
      count: 2,
      customer: {
        id: 'cust_123',
        profile: {
          email: 'jane@example.com',
          active: true,
        },
      },
      items: [
        { id: 'item_1', name: 'Item One' },
        { id: 'item_2', name: 'Item Two' },
      ],
    },
    rawBody: '{"success":true,"count":2}',
  };

  it('should safely extract nested properties with dot notation and arrays', () => {
    expect(getNestedValue(sampleResponse.body, 'success')).toBe(true);
    expect(getNestedValue(sampleResponse.body, 'customer.id')).toBe('cust_123');
    expect(getNestedValue(sampleResponse.body, 'customer.profile.email')).toBe('jane@example.com');
    expect(getNestedValue(sampleResponse.body, 'items.0.name')).toBe('Item One');
    expect(getNestedValue(sampleResponse.body, 'items[1].name')).toBe('Item Two');
    expect(getNestedValue(sampleResponse.body, 'non.existent.path')).toBeUndefined();
  });

  it('should evaluate STATUS_CODE_EQUALS correctly', () => {
    const passed = evaluateAssertions([{ type: 'STATUS_CODE_EQUALS', expected: '200' }], sampleResponse);
    expect(passed[0].passed).toBe(true);

    const failed = evaluateAssertions([{ type: 'STATUS_CODE_EQUALS', expected: '404' }], sampleResponse);
    expect(failed[0].passed).toBe(false);
  });

  it('should evaluate STATUS_CODE_IN_RANGE correctly', () => {
    const passed = evaluateAssertions([{ type: 'STATUS_CODE_IN_RANGE', expected: '200-299' }], sampleResponse);
    expect(passed[0].passed).toBe(true);

    const failed = evaluateAssertions([{ type: 'STATUS_CODE_IN_RANGE', expected: '400-499' }], sampleResponse);
    expect(failed[0].passed).toBe(false);
  });

  it('should evaluate RESPONSE_TIME_BELOW correctly', () => {
    const passed = evaluateAssertions([{ type: 'RESPONSE_TIME_BELOW', expected: '200' }], sampleResponse);
    expect(passed[0].passed).toBe(true);

    const failed = evaluateAssertions([{ type: 'RESPONSE_TIME_BELOW', expected: '50' }], sampleResponse);
    expect(failed[0].passed).toBe(false);
  });

  it('should evaluate HEADER_EXISTS and HEADER_EQUALS', () => {
    const exists = evaluateAssertions([{ type: 'HEADER_EXISTS', field: 'x-custom-header' }], sampleResponse);
    expect(exists[0].passed).toBe(true);

    const equals = evaluateAssertions(
      [{ type: 'HEADER_EQUALS', field: 'content-type', expected: 'application/json' }],
      sampleResponse
    );
    expect(equals[0].passed).toBe(true);
  });

  it('should evaluate JSON_FIELD_EXISTS and JSON_FIELD_EQUALS', () => {
    const exists = evaluateAssertions(
      [{ type: 'JSON_FIELD_EXISTS', field: 'customer.profile.email' }],
      sampleResponse
    );
    expect(exists[0].passed).toBe(true);

    const equals = evaluateAssertions(
      [
        { type: 'JSON_FIELD_EQUALS', field: 'customer.profile.email', expected: 'jane@example.com' },
        { type: 'JSON_FIELD_EQUALS', field: 'count', expected: '2' },
        { type: 'JSON_FIELD_EQUALS', field: 'customer.profile.active', expected: 'true' },
      ],
      sampleResponse
    );
    expect(equals.every((r) => r.passed)).toBe(true);
  });

  it('should evaluate BODY_CONTAINS', () => {
    const passed = evaluateAssertions([{ type: 'BODY_CONTAINS', expected: '"success":true' }], sampleResponse);
    expect(passed[0].passed).toBe(true);
  });
});
