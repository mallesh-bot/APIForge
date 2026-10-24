import TestRun from '../models/TestRun.js';
import Collection from '../models/Collection.js';
import SavedRequest from '../models/SavedRequest.js';
import { executeHttpRequest } from '../services/httpExecutor.js';
import { evaluateAssertions } from '../services/assertionEngine.js';
import { getDecryptedEnvironmentMap } from './environmentController.js';

function interpolate(str = '', varMap = {}) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (_match, v) => (varMap[v] !== undefined ? varMap[v] : `{{${v}}}`));
}

export async function runCollectionTests(req, res, next) {
  try {
    const { collectionId } = req.params;
    const { environmentId } = req.body;
    const userId = req.user.id;

    const collection = await Collection.findOne({ _id: collectionId, ownerId: userId });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const requests = await SavedRequest.find({ collectionId, ownerId: userId }).sort({ order: 1, createdAt: 1 });
    if (requests.length === 0) {
      return res.status(400).json({ success: false, message: 'No requests found in this collection to test' });
    }

    const varMap = await getDecryptedEnvironmentMap(environmentId, userId);

    let passedCount = 0;
    let failedCount = 0;
    const runResults = [];
    const overallStartTime = performance.now();

    for (const reqDoc of requests) {
      let targetUrl = interpolate(reqDoc.urlTemplate, varMap);

      // Build query params
      if (reqDoc.params && reqDoc.params.length > 0) {
        try {
          const urlObj = new URL(targetUrl);
          reqDoc.params
            .filter((p) => p.enabled && p.key)
            .forEach((p) => {
              urlObj.searchParams.set(interpolate(p.key, varMap), interpolate(p.value, varMap));
            });
          targetUrl = urlObj.toString();
        } catch {}
      }

      // Build headers
      const headers = {};
      if (reqDoc.headers && reqDoc.headers.length > 0) {
        reqDoc.headers
          .filter((h) => h.enabled && h.key)
          .forEach((h) => {
            headers[interpolate(h.key, varMap)] = interpolate(h.value, varMap);
          });
      }

      // Auth
      if (reqDoc.auth && reqDoc.auth.type) {
        if (reqDoc.auth.type === 'bearer' && reqDoc.auth.token) {
          headers['Authorization'] = `Bearer ${interpolate(reqDoc.auth.token, varMap)}`;
        } else if (reqDoc.auth.type === 'basic') {
          const user = interpolate(reqDoc.auth.username || '', varMap);
          const pass = interpolate(reqDoc.auth.password || '', varMap);
          headers['Authorization'] = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
        } else if (reqDoc.auth.type === 'apikey') {
          const header = interpolate(reqDoc.auth.apiKeyHeader || 'X-API-Key', varMap);
          headers[header] = interpolate(reqDoc.auth.apiKeyValue || '', varMap);
        }
      }

      // Body
      let body = null;
      if (reqDoc.body && reqDoc.body.type !== 'none' && reqDoc.body.content) {
        body = interpolate(reqDoc.body.content, varMap);
        if (reqDoc.body.type === 'json' && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      let httpResponse = null;
      let executionError = null;

      try {
        httpResponse = await executeHttpRequest({
          method: reqDoc.method,
          url: targetUrl,
          headers,
          body,
        });
      } catch (err) {
        executionError = err;
      }

      const requestResults = [];
      if (executionError) {
        failedCount += reqDoc.assertions.length || 1;
        requestResults.push({
          assertionType: 'EXECUTION',
          field: 'transport',
          expected: 'success',
          actual: 'error',
          passed: false,
          message: executionError.message,
        });
      } else {
        const assertionOutcomes = evaluateAssertions(reqDoc.assertions, httpResponse);
        for (const out of assertionOutcomes) {
          if (out.passed) passedCount++;
          else failedCount++;
          requestResults.push(out);
        }
      }

      runResults.push({
        requestId: reqDoc._id,
        requestName: reqDoc.name,
        method: reqDoc.method,
        url: targetUrl,
        statusCode: httpResponse?.statusCode ?? null,
        durationMs: httpResponse?.durationMs ?? 0,
        passed: requestResults.every((r) => r.passed),
        assertions: requestResults,
      });
    }

    const totalDurationMs = Math.round(performance.now() - overallStartTime);
    const totalCount = passedCount + failedCount;

    // Flatten all assertion results for the test run schema
    const allAssertionResults = runResults.flatMap((r) => r.assertions);

    const testRun = await TestRun.create({
      ownerId: userId,
      collectionId,
      passedCount,
      failedCount,
      totalCount,
      durationMs: totalDurationMs,
      results: allAssertionResults,
    });

    return res.status(201).json({
      success: true,
      testRun,
      summary: {
        totalRequests: requests.length,
        totalAssertions: totalCount,
        passed: passedCount,
        failed: failedCount,
        durationMs: totalDurationMs,
      },
      requests: runResults,
    });
  } catch (err) {
    next(err);
  }
}

export async function listTestRuns(req, res, next) {
  try {
    const testRuns = await TestRun.find({ ownerId: req.user.id })
      .populate('collectionId', 'name')
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      testRuns,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTestRun(req, res, next) {
  try {
    const testRun = await TestRun.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    }).populate('collectionId', 'name description');

    if (!testRun) {
      return res.status(404).json({ success: false, message: 'Test run not found' });
    }

    return res.status(200).json({
      success: true,
      testRun,
    });
  } catch (err) {
    next(err);
  }
}
