import { request } from 'undici';
import { validateDestination } from '../utils/ssrfGuard.js';

const MAX_BODY_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const DEFAULT_TIMEOUT_MS = 20000; // 20s
const MAX_REDIRECTS = 3;

/**
 * Strips sensitive headers and internal auth cookies from outgoing request headers.
 */
function sanitizeOutgoingHeaders(headers = {}) {
  const sanitized = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    // Do not forward server session cookies or internal headers
    if (lowerKey === 'cookie') {
      // If user explicitly configured custom cookies in the request builder, we preserve them
      // but remove any 'token=' or 'connect.sid=' that belongs to APIForge
      const cookies = String(value)
        .split(';')
        .map((c) => c.trim())
        .filter((c) => !c.startsWith('token=') && !c.startsWith('connect.sid='))
        .join('; ');
      if (cookies) sanitized[key] = cookies;
    } else if (lowerKey !== 'x-forwarded-for' && lowerKey !== 'x-forwarded-host') {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Safely executes an outbound HTTP request with SSRF validation, body clamping, and timing.
 */
export async function executeHttpRequest({
  method = 'GET',
  url,
  headers = {},
  body = null,
  timeout = DEFAULT_TIMEOUT_MS,
}) {
  let currentUrl = url;
  let redirectCount = 0;

  while (redirectCount <= MAX_REDIRECTS) {
    // 1. SSRF destination check
    await validateDestination(currentUrl);

    // 2. Prepare request
    const cleanHeaders = sanitizeOutgoingHeaders(headers);
    const startTime = performance.now();

    const signal = AbortSignal.timeout(timeout);

    let response;
    try {
      response = await request(currentUrl, {
        method,
        headers: cleanHeaders,
        body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
        signal,
        maxRedirections: 0, // Handle redirects manually for SSRF revalidation
      });
    } catch (err) {
      if (err.name === 'TimeoutError' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
        const timeoutErr = new Error(`Request timed out after ${timeout}ms`);
        timeoutErr.statusCode = 504;
        throw timeoutErr;
      }
      const netErr = new Error(`Connection failed: ${err.message}`);
      netErr.statusCode = 502;
      throw netErr;
    }

    const durationMs = Math.round(performance.now() - startTime);

    // 3. Handle redirects safely
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      const location = response.headers.location;
      if (location && redirectCount < MAX_REDIRECTS) {
        redirectCount++;
        const resolvedRedirectUrl = new URL(location, currentUrl).toString();
        currentUrl = resolvedRedirectUrl;
        // 303 changes method to GET
        if (response.statusCode === 303) {
          method = 'GET';
          body = null;
        }
        continue;
      }
    }

    // 4. Read and clamp response body
    const contentType = response.headers['content-type'] || '';
    let totalBytes = 0;
    const chunks = [];

    for await (const chunk of response.body) {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_SIZE_BYTES) {
        const error = new Error(`Response body exceeded maximum allowed limit of 5MB`);
        error.statusCode = 502;
        throw error;
      }
      chunks.push(chunk);
    }

    const rawBuffer = Buffer.concat(chunks);
    const rawBody = rawBuffer.toString('utf8');

    let parsedBody = rawBody;
    if (contentType.includes('application/json')) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        parsedBody = rawBody;
      }
    }

    return {
      statusCode: response.statusCode,
      statusText: getStatusText(response.statusCode),
      headers: response.headers,
      body: parsedBody,
      rawBody,
      durationMs,
      responseSize: rawBuffer.length,
      contentType,
    };
  }

  const err = new Error('Too many redirects');
  err.statusCode = 502;
  throw err;
}

function getStatusText(code) {
  const map = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return map[code] || 'Status ' + code;
}
