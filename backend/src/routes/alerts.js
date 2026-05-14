const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Default alert thresholds
const DEFAULT_THRESHOLDS = {
  churn_rate_pct: 20,        // alert if churn > 20%
  revenue_decline_pct: 15,   // alert if revenue down > 15%
  maintenance_urgency: 'immediate' // alert if any maintenance urgency = 'immediate'
};

// In-memory threshold overrides per location (persists during server lifetime)
const locationThresholds = new Map();

// ─── Optional email notification helper ──────────────────────────────────────

async function sendEmailNotification(subject, body) {
  if (!process.env.SMTP_HOST) return; // gracefully skip if not configured
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.ALERT_EMAIL || process.env.SMTP_USER,
      subject,
      text: body
    });
    console.log(`[Alerts] Email sent: ${subject}`);
  } catch (err) {
    console.warn('[Alerts] Email notification failed:', err.message);
  }
}

// ─── POST /api/alerts/configure ───────────────────────────────────────────────

router.post('/configure', async (req, res) => {
  try {
    const { location_id, churn_rate_pct, revenue_decline_pct, maintenance_urgency } = req.body;
    if (!location_id) return res.status(400).json({ error: 'location_id is required' });

    const thresholds = {
      churn_rate_pct: churn_rate_pct ?? DEFAULT_THRESHOLDS.churn_rate_pct,
      revenue_decline_pct: revenue_decline_pct ?? DEFAULT_THRESHOLDS.revenue_decline_pct,
      maintenance_urgency: maintenance_urgency ?? DEFAULT_THRESHOLDS.maintenance_urgency
    };

    locationThresholds.set(String(location_id), thresholds);
    res.json({ message: 'Alert thresholds configured', location_id, thresholds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/alerts/active ───────────────────────────────────────────────────

router.get('/active', async (req, res) => {
  try {
    const { location_id } = req.query;
    const activeAlerts = [];

    // Determine which locations to check
    let locationIds;
    if (location_id) {
      locationIds = [String(location_id)];
    } else {
      const locs = await pool.query('SELECT id FROM locations ORDER BY id');
      locationIds = locs.rows.map(r => String(r.id));
    }

    for (const locId of locationIds) {
      const thresholds = locationThresholds.get(locId) || DEFAULT_THRESHOLDS;

      // 1. Churn rate check
      try {
        const memberships = await pool.query(
          'SELECT COUNT(*) as total, SUM(CASE WHEN churn_risk > $1 THEN 1 ELSE 0 END) as at_risk FROM memberships WHERE location_id = $2',
          [0.7, locId]
        );
        const row = memberships.rows[0];
        const total = Number(row.total);
        const atRisk = Number(row.at_risk);
        if (total > 0) {
          const churnPct = (atRisk / total) * 100;
          if (churnPct > thresholds.churn_rate_pct) {
            const alert = {
              type: 'high_churn_risk',
              severity: churnPct > thresholds.churn_rate_pct * 1.5 ? 'critical' : 'warning',
              location_id: locId,
              message: `Churn risk is ${churnPct.toFixed(1)}% (threshold: ${thresholds.churn_rate_pct}%)`,
              at_risk_count: atRisk,
              total_members: total,
              triggered_at: new Date().toISOString()
            };
            activeAlerts.push(alert);
            await sendEmailNotification(
              `[Alert] High Churn Risk at Location ${locId}`,
              alert.message
            );
          }
        }
      } catch (_) {}

      // 2. Revenue decline check
      try {
        const revData = await pool.query(
          'SELECT date, total_revenue FROM revenue_analytics WHERE location_id = $1 ORDER BY date DESC LIMIT 14',
          [locId]
        );
        if (revData.rows.length >= 2) {
          const recentRevenue = revData.rows.slice(0, 7).reduce((s, r) => s + Number(r.total_revenue || 0), 0);
          const previousRevenue = revData.rows.slice(7, 14).reduce((s, r) => s + Number(r.total_revenue || 0), 0);
          if (previousRevenue > 0) {
            const declinePct = ((previousRevenue - recentRevenue) / previousRevenue) * 100;
            if (declinePct > thresholds.revenue_decline_pct) {
              const alert = {
                type: 'revenue_decline',
                severity: declinePct > thresholds.revenue_decline_pct * 1.5 ? 'critical' : 'warning',
                location_id: locId,
                message: `Revenue declined ${declinePct.toFixed(1)}% week-over-week (threshold: ${thresholds.revenue_decline_pct}%)`,
                recent_revenue: recentRevenue,
                previous_revenue: previousRevenue,
                triggered_at: new Date().toISOString()
              };
              activeAlerts.push(alert);
              await sendEmailNotification(
                `[Alert] Revenue Decline at Location ${locId}`,
                alert.message
              );
            }
          }
        }
      } catch (_) {}

      // 3. Immediate maintenance urgency check
      try {
        const maintenance = await pool.query(
          "SELECT mp.*, e.name as equipment_name FROM maintenance_predictions mp JOIN equipment e ON mp.equipment_id = e.id WHERE e.location_id = $1 AND mp.urgency = $2",
          [locId, thresholds.maintenance_urgency]
        );
        if (maintenance.rows.length > 0) {
          const alert = {
            type: 'immediate_maintenance_required',
            severity: 'critical',
            location_id: locId,
            message: `${maintenance.rows.length} equipment item(s) require immediate maintenance`,
            equipment: maintenance.rows.map(r => ({ id: r.equipment_id, name: r.equipment_name, action: r.recommended_action })),
            triggered_at: new Date().toISOString()
          };
          activeAlerts.push(alert);
          await sendEmailNotification(
            `[Alert] Immediate Maintenance Required at Location ${locId}`,
            alert.message
          );
        }
      } catch (_) {}
    }

    res.json({
      active_alerts: activeAlerts,
      total: activeAlerts.length,
      checked_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/alerts/thresholds ───────────────────────────────────────────────

router.get('/thresholds', (req, res) => {
  const { location_id } = req.query;
  if (location_id) {
    const t = locationThresholds.get(String(location_id)) || DEFAULT_THRESHOLDS;
    return res.json({ location_id, thresholds: t });
  }
  const all = {};
  for (const [k, v] of locationThresholds.entries()) all[k] = v;
  res.json({ defaults: DEFAULT_THRESHOLDS, configured: all });
});

module.exports = router;
