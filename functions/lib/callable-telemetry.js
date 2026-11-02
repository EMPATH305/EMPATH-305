'use strict';

const SAFE_RESULT_FLAGS = Object.freeze([
  'accepted',
  'alreadyCompleted',
  'available',
  'completed',
  'counted',
  'deduplicated',
  'deleted',
  'retired'
]);

const SAFE_ERROR_CODES = new Set([
  'aborted',
  'already-exists',
  'cancelled',
  'data-loss',
  'deadline-exceeded',
  'failed-precondition',
  'internal',
  'invalid-argument',
  'not-found',
  'out-of-range',
  'permission-denied',
  'resource-exhausted',
  'unauthenticated',
  'unavailable',
  'unimplemented',
  'unknown'
]);

function safeErrorCode(error) {
  const raw = String(error?.code || '').replace(/^functions\//, '');
  return SAFE_ERROR_CODES.has(raw) ? raw : 'internal';
}

function safeResultFlags(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return {};
  return Object.fromEntries(
    SAFE_RESULT_FLAGS
      .filter(key => typeof result[key] === 'boolean')
      .map(key => [key, result[key]])
  );
}

function durationBucket(durationMs) {
  const duration = Math.max(0, Number(durationMs) || 0);
  if (duration < 250) return 'under-250ms';
  if (duration < 1_000) return '250-999ms';
  if (duration < 3_000) return '1-2.9s';
  if (duration < 10_000) return '3-9.9s';
  return '10s-plus';
}

function coarseClientFamily(request) {
  const rawHeader = request?.rawRequest?.headers?.['user-agent'];
  const userAgent = String(Array.isArray(rawHeader) ? rawHeader[0] : rawHeader || '').toLowerCase();
  if (!userAgent) return 'unknown';
  const embedded = /instagram|\bfbav\b|\bfban\b|\bline\//.test(userAgent)
    || /;\s*wv\)/.test(userAgent);
  if (/iphone|ipad|ipod/.test(userAgent)) return embedded ? 'ios-embedded' : 'ios-browser';
  if (/android/.test(userAgent)) return embedded ? 'android-embedded' : 'android-browser';
  return embedded ? 'other-embedded' : 'desktop-browser';
}

function createCallableTelemetry(logger, now = Date.now) {
  if (!logger || typeof logger.info !== 'function' || typeof logger.warn !== 'function') {
    throw new TypeError('A structured logger is required.');
  }

  return function withCallableTelemetry(functionName, appCheckEnforced, handler) {
    if (!/^[A-Za-z][A-Za-z0-9]{1,63}$/.test(String(functionName))) {
      throw new TypeError('A stable callable function name is required.');
    }
    if (typeof handler !== 'function') throw new TypeError('A callable handler is required.');

    return async request => {
      const startedAt = now();
      const shared = {
        telemetryEvent:'empath.callable',
        telemetryVersion:1,
        functionName,
        appCheckVerified:Boolean(request?.app),
        appCheckEnforced:appCheckEnforced === true,
        authenticated:Boolean(request?.auth),
        clientFamily:coarseClientFamily(request)
      };

      try {
        const result = await handler(request);
        logger.info('EMPATH callable completed', {
          ...shared,
          outcome:'success',
          durationBucket:durationBucket(now() - startedAt),
          ...safeResultFlags(result)
        });
        return result;
      } catch (error) {
        logger.warn('EMPATH callable rejected', {
          ...shared,
          outcome:'rejected',
          durationBucket:durationBucket(now() - startedAt),
          errorCode:safeErrorCode(error)
        });
        throw error;
      }
    };
  };
}

module.exports = {
  createCallableTelemetry,
  coarseClientFamily,
  durationBucket,
  safeErrorCode,
  safeResultFlags
};
