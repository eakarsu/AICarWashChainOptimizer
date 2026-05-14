/**
 * Apply pass 5 — backlog integrations (NEEDS-CREDS 503-stubs).
 *
 * Required env vars per provider:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM        (email alerts)
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER     (SMS alerts to managers)
 *   STRIPE_SECRET_KEY                                             (membership billing)
 *   OPENWEATHER_API_KEY                                           (weather feed for staffing)
 *   FCM_SERVER_KEY                                                (mobile push notifications)
 *
 * Each route returns 503 + `{ missing }` until creds set.
 */
const express = require('express');
const auth = require('../middleware/auth');
const pool = require('../db/connection');

const router = express.Router();
router.use(auth);

(async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        channel VARCHAR(32) NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT,
        body TEXT,
        status VARCHAR(32) DEFAULT 'queued_stub',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (_) {}
})();

function missingEnv(...keys) {
  return keys.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
}
function need(envs, label, res) {
  const miss = missingEnv(...envs);
  if (miss.length) { res.status(503).json({ error: `${label} not configured`, missing: miss }); return false; }
  return true;
}

router.post('/notifications/email', async (req, res) => {
  if (!need(['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'], 'SMTP email', res)) return;
  const { to, subject, body } = req.body || {};
  if (!to || !subject) return res.status(400).json({ error: 'to and subject required' });
  try {
    await pool.query(
      `INSERT INTO notification_log (user_id, channel, recipient, subject, body) VALUES ($1, 'email', $2, $3, $4)`,
      [req.user?.id || null, to, subject, body || '']
    );
  } catch (_) {}
  res.json({ status: 'queued', provider: 'smtp', note: 'stub' });
});

router.post('/notifications/sms', async (req, res) => {
  if (!need(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'], 'Twilio SMS', res)) return;
  const { to, body } = req.body || {};
  if (!to || !body) return res.status(400).json({ error: 'to and body required' });
  try {
    await pool.query(
      `INSERT INTO notification_log (user_id, channel, recipient, body) VALUES ($1, 'sms', $2, $3)`,
      [req.user?.id || null, to, body]
    );
  } catch (_) {}
  res.json({ status: 'queued', provider: 'twilio', note: 'stub' });
});

router.post('/notifications/push', (req, res) => {
  if (!need(['FCM_SERVER_KEY'], 'FCM push', res)) return;
  res.json({ status: 'queued', provider: 'fcm', note: 'stub' });
});

router.post('/billing/stripe/subscription', (req, res) => {
  if (!need(['STRIPE_SECRET_KEY'], 'Stripe', res)) return;
  res.json({ status: 'queued', provider: 'stripe', note: 'stub — wire stripe SDK when ready' });
});

router.get('/weather/openweather', (req, res) => {
  if (!need(['OPENWEATHER_API_KEY'], 'OpenWeather', res)) return;
  const { lat, lon } = req.query || {};
  res.json({ provider: 'openweather', lat: lat || null, lon: lon || null, forecast: [], note: 'stub — wire OpenWeather One Call API when ready' });
});

router.get('/notifications/log', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, channel, recipient, subject, status, created_at FROM notification_log
       WHERE user_id = $1 ORDER BY id DESC LIMIT 50`,
      [req.user?.id || null]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'failed', details: err.message }); }
});

module.exports = router;
