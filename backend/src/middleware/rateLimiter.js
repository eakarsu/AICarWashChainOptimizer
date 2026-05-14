/**
 * Simple in-memory rate limiter: 20 AI calls per hour per user.
 * Uses userId from req.user (set by auth middleware) or IP as fallback.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_CALLS = 20;

// Map of key -> { count, resetAt }
const store = new Map();

function getRateLimitKey(req) {
  if (req.user && req.user.id) return `user:${req.user.id}`;
  return `ip:${req.ip}`;
}

function aiRateLimiter(req, res, next) {
  const key = getRateLimitKey(req);
  const now = Date.now();

  let record = store.get(key);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, record);
  }

  record.count += 1;

  res.setHeader('X-RateLimit-Limit', MAX_CALLS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_CALLS - record.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

  if (record.count > MAX_CALLS) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Maximum ${MAX_CALLS} AI calls per hour. Try again later.`,
      retryAfter: Math.ceil((record.resetAt - now) / 1000)
    });
  }

  next();
}

module.exports = { aiRateLimiter };
