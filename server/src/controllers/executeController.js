import { executeHttpRequest } from '../services/httpExecutor.js';
import { evaluateAssertions } from '../services/assertionEngine.js';
import { getDecryptedEnvironmentMap } from './environmentController.js';
import RequestHistory from '../models/RequestHistory.js';

/**
 * Replaces {{variableName}} templates with values from the environment dictionary.
 */
function interpolateVariables(template = '', varMap = {}) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_match, varName) => {
    return varMap[varName] !== undefined ? varMap[varName] : `{{${varName}}}`;
  });
}

/**
 * Strips or masks auth credentials from URL before saving to history.
 */
function sanitizeUrlForHistory(urlStr = '') {
  try {
    const parsed = new URL(urlStr);
    // Mask sensitive query params if present
    const sensitiveParams = ['token', 'secret', 'apikey', 'api_key', 'key', 'password', 'auth'];
    for (const p of sensitiveParams) {
      if (parsed.searchParams.has(p)) {
        parsed.searchParams.set(p, '********');
      }
    }
    return parsed.toString();
  } catch {
    return urlStr;
  }
}

export async function executeRequest(req, res, next) {
  try {
    const {
      method = 'GET',
      url: rawUrl = '',
      params = [],
      headers = [],
      auth = { type: 'none' },
      body = { type: 'none', content: '' },
      environmentId = null,
      assertions = [],
    } = req.body;

    if (!rawUrl || !rawUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Request URL is required',
      });
    }

    // 1. Fetch environment variables for interpolation
    const varMap = await getDecryptedEnvironmentMap(environmentId, req.user.id);

    // 2. Interpolate URL
    let targetUrl = interpolateVariables(rawUrl.trim(), varMap);

    // 3. Append enabled query parameters
    const enabledParams = Array.isArray(params)
      ? params.filter((p) => p.enabled && p.key)
      : [];

    if (enabledParams.length > 0) {
      try {
        const urlObj = new URL(targetUrl);
        for (const p of enabledParams) {
          const interpolatedKey = interpolateVariables(p.key, varMap);
          const interpolatedValue = interpolateVariables(p.value, varMap);
          urlObj.searchParams.set(interpolatedKey, interpolatedValue);
        }
        targetUrl = urlObj.toString();
      } catch {
        // If relative or malformed initially, will fail in executor
      }
    }

    // 4. Construct and interpolate headers
    const requestHeaders = {};
    if (Array.isArray(headers)) {
      for (const h of headers) {
        if (h.enabled && h.key) {
          const key = interpolateVariables(h.key, varMap);
          const val = interpolateVariables(h.value, varMap);
          requestHeaders[key] = val;
        }
      }
    }

    // 5. Apply authentication configuration
    if (auth && auth.type) {
      switch (auth.type) {
        case 'bearer': {
          const token = interpolateVariables(auth.token || '', varMap);
          if (token) requestHeaders['Authorization'] = `Bearer ${token}`;
          break;
        }
        case 'basic': {
          const user = interpolateVariables(auth.username || '', varMap);
          const pass = interpolateVariables(auth.password || '', varMap);
          const base64Auth = Buffer.from(`${user}:${pass}`).toString('base64');
          requestHeaders['Authorization'] = `Basic ${base64Auth}`;
          break;
        }
        case 'apikey': {
          const headerName = interpolateVariables(auth.apiKeyHeader || 'X-API-Key', varMap);
          const headerValue = interpolateVariables(auth.apiKeyValue || '', varMap);
          if (headerName && headerValue) {
            requestHeaders[headerName] = headerValue;
          }
          break;
        }
      }
    }

    // 6. Format and interpolate body
    let requestBody = null;
    if (body && body.type && body.type !== 'none' && body.content) {
      const interpolatedBody = interpolateVariables(body.content, varMap);
      if (body.type === 'json') {
        if (!requestHeaders['Content-Type']) {
          requestHeaders['Content-Type'] = 'application/json';
        }
        requestBody = interpolatedBody;
      } else {
        requestBody = interpolatedBody;
      }
    }

    // 7. Execute outbound HTTP request
    const response = await executeHttpRequest({
      method: method.toUpperCase(),
      url: targetUrl,
      headers: requestHeaders,
      body: requestBody,
    });

    // 8. Run assertions
    const assertionResults = evaluateAssertions(assertions, response);

    // 9. Record in execution history (without auth credentials or large body payloads)
    const sanitizedUrl = sanitizeUrlForHistory(targetUrl);
    await RequestHistory.create({
      ownerId: req.user.id,
      method: method.toUpperCase(),
      url: sanitizedUrl,
      statusCode: response.statusCode,
      statusText: response.statusText,
      durationMs: response.durationMs,
      responseSize: response.responseSize,
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      response,
      assertions: assertionResults,
    });
  } catch (err) {
    next(err);
  }
}
