const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

/**
 * Forecast versioning routes.
 * Stores AI forecasts with version number, timestamp, and source data snapshot.
 *
 * NOTE: Requires the ai_forecast_history table to exist.
 * Auto-creates it on first use if it doesn't exist.
 */

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_forecast_history (
      id SERIAL PRIMARY KEY,
      location_id INTEGER NOT NULL,
      forecast_type VARCHAR(100) NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      source_data JSONB,
      forecast_result JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_by VARCHAR(255)
    )
  `);
}

// ─── POST /api/forecasts/save ─────────────────────────────────────────────────
// Save a forecast result with versioning

router.post('/save', async (req, res) => {
  try {
    await ensureTable();
    const { location_id, forecast_type, source_data, forecast_result, created_by } = req.body;

    if (!location_id || !forecast_type || !forecast_result) {
      return res.status(400).json({ error: 'location_id, forecast_type, and forecast_result are required' });
    }

    // Get the next version number for this location + type
    const versionResult = await pool.query(
      'SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM ai_forecast_history WHERE location_id = $1 AND forecast_type = $2',
      [location_id, forecast_type]
    );
    const nextVersion = versionResult.rows[0].next_version;

    const saved = await pool.query(
      `INSERT INTO ai_forecast_history (location_id, forecast_type, version, source_data, forecast_result, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       RETURNING *`,
      [location_id, forecast_type, nextVersion, JSON.stringify(source_data || {}), JSON.stringify(forecast_result), created_by || null]
    );

    res.status(201).json({
      message: 'Forecast saved',
      forecast: saved.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/forecasts/history/:location_id ──────────────────────────────────
// Returns forecast history for a location, with optional type filter and pagination

router.get('/history/:location_id', async (req, res) => {
  try {
    await ensureTable();
    const { location_id } = req.params;
    const { forecast_type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT * FROM ai_forecast_history WHERE location_id = $1';
    const params = [location_id];

    if (forecast_type) {
      params.push(forecast_type);
      query += ` AND forecast_type = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Count total for pagination
    const countParams = [location_id];
    let countQuery = 'SELECT COUNT(*) FROM ai_forecast_history WHERE location_id = $1';
    if (forecast_type) {
      countParams.push(forecast_type);
      countQuery += ` AND forecast_type = $${countParams.length}`;
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = Number(countResult.rows[0].count);

    res.json({
      location_id,
      forecast_type: forecast_type || 'all',
      history: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/forecasts/compare/:location_id ─────────────────────────────────
// Compare two versions of a forecast

router.get('/compare/:location_id', async (req, res) => {
  try {
    await ensureTable();
    const { location_id } = req.params;
    const { forecast_type, version_a, version_b } = req.query;

    if (!forecast_type || !version_a || !version_b) {
      return res.status(400).json({ error: 'forecast_type, version_a, and version_b are required query params' });
    }

    const [a, b] = await Promise.all([
      pool.query(
        'SELECT * FROM ai_forecast_history WHERE location_id = $1 AND forecast_type = $2 AND version = $3',
        [location_id, forecast_type, Number(version_a)]
      ),
      pool.query(
        'SELECT * FROM ai_forecast_history WHERE location_id = $1 AND forecast_type = $2 AND version = $3',
        [location_id, forecast_type, Number(version_b)]
      )
    ]);

    if (!a.rows.length) return res.status(404).json({ error: `Version ${version_a} not found` });
    if (!b.rows.length) return res.status(404).json({ error: `Version ${version_b} not found` });

    res.json({
      location_id,
      forecast_type,
      version_a: a.rows[0],
      version_b: b.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/forecasts/latest/:location_id ───────────────────────────────────
// Get the latest forecast of each type for a location

router.get('/latest/:location_id', async (req, res) => {
  try {
    await ensureTable();
    const { location_id } = req.params;

    const result = await pool.query(`
      SELECT DISTINCT ON (forecast_type) *
      FROM ai_forecast_history
      WHERE location_id = $1
      ORDER BY forecast_type, created_at DESC
    `, [location_id]);

    res.json({ location_id, latest_forecasts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
