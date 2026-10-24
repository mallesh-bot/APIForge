/**
 * Safely resolves a nested property path (e.g., 'customer.email' or 'products.0.title')
 * without using eval() or Function constructors.
 */
export function getNestedValue(obj, path) {
  if (!obj || typeof obj !== 'object' || !path) return undefined;

  // Normalize brackets: a[0].b -> a.0.b
  const normalizedPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const parts = normalizedPath.split('.');

  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Coerces expected string value to match the type of the actual value for fair comparison.
 */
function coerceExpected(expected, actual) {
  if (typeof actual === 'boolean') {
    if (expected === 'true') return true;
    if (expected === 'false') return false;
  }
  if (typeof actual === 'number') {
    const num = Number(expected);
    if (!isNaN(num)) return num;
  }
  return expected;
}

/**
 * Evaluates an array of assertions against an HTTP response.
 * @param {Array} assertions - Array of assertion definition objects
 * @param {Object} response - { statusCode, headers, body, rawBody, durationMs }
 * @returns {Array} Results with passed/failed status and diagnostics
 */
export function evaluateAssertions(assertions = [], response = {}) {
  if (!Array.isArray(assertions) || assertions.length === 0) {
    return [];
  }

  return assertions.map((assertion) => {
    const { type, field = '', expected = '' } = assertion;

    switch (type) {
      case 'STATUS_CODE_EQUALS': {
        const expectedCode = parseInt(expected, 10);
        const actualCode = response.statusCode;
        const passed = actualCode === expectedCode;
        return {
          assertionType: type,
          field: 'statusCode',
          expected: String(expectedCode),
          actual: String(actualCode),
          passed,
          message: passed
            ? `Status code equals ${expectedCode}`
            : `Expected status code ${expectedCode} but received ${actualCode}`,
        };
      }

      case 'STATUS_CODE_IN_RANGE': {
        const [minStr, maxStr] = expected.split('-').map((s) => s.trim());
        const min = parseInt(minStr, 10);
        const max = parseInt(maxStr, 10);
        const actualCode = response.statusCode;
        const passed = actualCode >= min && actualCode <= max;
        return {
          assertionType: type,
          field: 'statusCode',
          expected: `${min}-${max}`,
          actual: String(actualCode),
          passed,
          message: passed
            ? `Status code ${actualCode} is within range ${min}-${max}`
            : `Status code ${actualCode} is outside range ${min}-${max}`,
        };
      }

      case 'RESPONSE_TIME_BELOW': {
        const threshold = parseInt(expected, 10);
        const actualDuration = response.durationMs ?? 0;
        const passed = actualDuration < threshold;
        return {
          assertionType: type,
          field: 'durationMs',
          expected: `< ${threshold}ms`,
          actual: `${actualDuration}ms`,
          passed,
          message: passed
            ? `Response time ${actualDuration}ms was under ${threshold}ms`
            : `Response time ${actualDuration}ms exceeded threshold of ${threshold}ms`,
        };
      }

      case 'HEADER_EXISTS': {
        const headerKey = field.toLowerCase();
        const headerValue = response.headers ? response.headers[headerKey] : undefined;
        const passed = headerValue !== undefined && headerValue !== null;
        return {
          assertionType: type,
          field,
          expected: 'exists',
          actual: passed ? 'present' : 'missing',
          passed,
          message: passed
            ? `Header '${field}' exists`
            : `Header '${field}' was not found in response`,
        };
      }

      case 'HEADER_EQUALS': {
        const headerKey = field.toLowerCase();
        const actualHeader = response.headers ? String(response.headers[headerKey] || '') : '';
        const passed = actualHeader.toLowerCase().includes(expected.toLowerCase());
        return {
          assertionType: type,
          field,
          expected,
          actual: actualHeader,
          passed,
          message: passed
            ? `Header '${field}' contains '${expected}'`
            : `Header '${field}' expected '${expected}' but received '${actualHeader}'`,
        };
      }

      case 'JSON_FIELD_EXISTS': {
        const actualVal = getNestedValue(response.body, field);
        const passed = actualVal !== undefined;
        return {
          assertionType: type,
          field,
          expected: 'exists',
          actual: passed ? (typeof actualVal === 'object' ? 'object' : String(actualVal)) : 'undefined',
          passed,
          message: passed
            ? `Field '${field}' exists in response body`
            : `Field '${field}' does not exist in response body`,
        };
      }

      case 'JSON_FIELD_EQUALS': {
        const actualVal = getNestedValue(response.body, field);
        const typedExpected = coerceExpected(expected, actualVal);
        const passed = actualVal === typedExpected || String(actualVal) === String(expected);
        return {
          assertionType: type,
          field,
          expected: String(expected),
          actual: actualVal === undefined ? 'undefined' : String(actualVal),
          passed,
          message: passed
            ? `Field '${field}' equals '${expected}'`
            : `Field '${field}' expected '${expected}' but received '${actualVal}'`,
        };
      }

      case 'BODY_CONTAINS': {
        const raw = response.rawBody || (typeof response.body === 'string' ? response.body : JSON.stringify(response.body || ''));
        const passed = raw.includes(expected);
        return {
          assertionType: type,
          field: 'body',
          expected: `contains '${expected}'`,
          actual: passed ? 'found' : 'not found',
          passed,
          message: passed
            ? `Response body contains '${expected}'`
            : `Response body does not contain '${expected}'`,
        };
      }

      default:
        return {
          assertionType: type,
          field,
          expected,
          actual: 'unknown',
          passed: false,
          message: `Unknown assertion type: ${type}`,
        };
    }
  });
}
