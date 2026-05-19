// Custom Views router - synthesized car-wash chain ops data
// Mounted at /api/custom-views
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');

// ---------------- Auth (best-effort, optional) ----------------
let authMiddleware = (req, res, next) => next();
try {
  const m = require('../middleware/auth');
  if (typeof m === 'function') authMiddleware = m;
  else if (m && typeof m.authenticate === 'function') authMiddleware = m.authenticate;
  else if (m && typeof m.authenticateToken === 'function') authMiddleware = m.authenticateToken;
} catch (_) { /* leave as no-op */ }

// ---------------- DB (optional) ----------------
let dbPool = null;
try {
  const m = require('../db/connection');
  if (m && typeof m.query === 'function') dbPool = m;
  else if (m && m.pool && typeof m.pool.query === 'function') dbPool = m.pool;
} catch (_) {}

// ---------------- Seeded RNG for reproducible synthetic data ----------------
function seededRand(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ---------------- VIZ 1: Locations map data ----------------
router.get('/locations-map', authMiddleware, async (req, res) => {
  try {
    let rows = [];
    if (dbPool) {
      try {
        const r = await dbPool.query('SELECT id, name, city, address FROM locations LIMIT 50');
        rows = r.rows || [];
      } catch (_) {}
    }
    // Anchor approx around continental US
    const cityAnchors = {
      'New York': [40.7128, -74.0060],
      'Los Angeles': [34.0522, -118.2437],
      'Chicago': [41.8781, -87.6298],
      'Houston': [29.7604, -95.3698],
      'Phoenix': [33.4484, -112.0740],
      'Philadelphia': [39.9526, -75.1652],
      'San Antonio': [29.4241, -98.4936],
      'San Diego': [32.7157, -117.1611],
      'Dallas': [32.7767, -96.7970],
      'Austin': [30.2672, -97.7431],
    };
    const cities = Object.keys(cityAnchors);
    const rnd = seededRand(91317);
    if (!rows.length) {
      rows = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `SparkleWash #${100 + i}`,
        city: cities[i % cities.length],
        address: `${100 + Math.floor(rnd() * 900)} Main St`,
      }));
    }
    const points = rows.map((row, idx) => {
      const cityKey = cities.includes(row.city) ? row.city : cities[idx % cities.length];
      const [lat0, lng0] = cityAnchors[cityKey];
      const jitterLat = (rnd() - 0.5) * 0.6;
      const jitterLng = (rnd() - 0.5) * 0.6;
      const revenue = Math.round(8000 + rnd() * 35000);
      const wph = Math.round(15 + rnd() * 40); // washes per hour
      return {
        id: row.id,
        name: row.name,
        city: cityKey,
        address: row.address || '',
        lat: +(lat0 + jitterLat).toFixed(4),
        lng: +(lng0 + jitterLng).toFixed(4),
        revenue_weekly: revenue,
        washes_per_hour: wph,
        status: rnd() > 0.15 ? 'open' : 'maintenance',
      };
    });
    res.json({ source: dbPool ? 'db+synth' : 'synth', points });
  } catch (err) {
    res.status(500).json({ error: 'locations-map failed', details: String(err.message || err) });
  }
});

// ---------------- VIZ 2: Throughput per bay ----------------
router.get('/throughput-per-bay', authMiddleware, async (req, res) => {
  try {
    const locationId = parseInt(req.query.location_id || '1', 10);
    const rnd = seededRand(20251 + locationId * 7);
    const bays = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5', 'Bay 6'];
    const hours = ['07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
    const series = bays.map((bay, bIdx) => ({
      bay,
      capacity: 25,
      data: hours.map((h) => {
        const base = 8 + Math.round(rnd() * 14);
        const peak = (h === '12' || h === '17') ? 4 : 0;
        return { hour: `${h}:00`, washes: Math.min(25, base + peak + Math.round(rnd() * 3)) };
      }),
    }));
    const totals = series.map(s => ({ bay: s.bay, total: s.data.reduce((a, b) => a + b.washes, 0) }));
    const grand_total = totals.reduce((a, b) => a + b.total, 0);
    res.json({ location_id: locationId, hours, series, totals, grand_total });
  } catch (err) {
    res.status(500).json({ error: 'throughput-per-bay failed', details: String(err.message || err) });
  }
});

// ---------------- NON-VIZ 1: Shift schedule PDF ----------------
router.get('/shift-schedule.pdf', authMiddleware, async (req, res) => {
  try {
    const week = req.query.week || new Date().toISOString().slice(0, 10);
    const locationName = req.query.location || 'SparkleWash #101';
    const rnd = seededRand(Date.parse(week) || 12345);
    const employees = [
      'A. Johnson', 'M. Chen', 'R. Patel', 'S. Garcia', 'J. Williams',
      'L. Brown', 'T. Davis', 'K. Wilson', 'D. Martinez', 'E. Anderson',
    ];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const shifts = ['Open 6a-2p', 'Mid 10a-6p', 'Close 2p-10p'];

    const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="shift-schedule-${week}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).fillColor('#0f172a').text('SparkleWash - Weekly Shift Schedule', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#475569').text(`Location: ${locationName}    Week of: ${week}`, { align: 'center' });
    doc.moveDown(1);

    // Table header
    const startX = 40;
    let y = doc.y;
    const colWidths = [120, 65, 65, 65, 65, 65, 65, 65];
    const headers = ['Employee', ...days];
    doc.fontSize(10).fillColor('#ffffff');
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 22).fill('#1e3a5f');
    let x = startX;
    headers.forEach((h, i) => {
      doc.fillColor('#ffffff').text(h, x + 6, y + 6, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });
    y += 22;

    employees.forEach((emp, rowIdx) => {
      const rowH = 24;
      if (rowIdx % 2 === 0) {
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowH).fill('#f1f5f9');
      }
      x = startX;
      doc.fillColor('#0f172a').fontSize(10).text(emp, x + 6, y + 7, { width: colWidths[0] - 8 });
      x += colWidths[0];
      days.forEach((_, dIdx) => {
        const off = rnd() < 0.18;
        const label = off ? 'OFF' : shifts[Math.floor(rnd() * shifts.length)].split(' ')[0];
        doc.fillColor(off ? '#94a3b8' : '#0f172a').fontSize(9).text(label, x + 6, y + 8, { width: colWidths[dIdx + 1] - 8 });
        x += colWidths[dIdx + 1];
      });
      y += rowH;
    });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#64748b').text(
      'Auto-generated by SparkleWash CarWash Views. Shifts: Open 6a-2p, Mid 10a-6p, Close 2p-10p.',
      40, y + 16, { align: 'center', width: 530 }
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'shift-schedule failed', details: String(err.message || err) });
  }
});

// ---------------- NON-VIZ 2: Membership pricing editor ----------------
const MEM_DEFAULTS = [
  { tier: 'Basic',     price: 19.99, washes_per_month: 4,  perks: ['Exterior wash'] },
  { tier: 'Premium',   price: 29.99, washes_per_month: 8,  perks: ['Exterior wash', 'Tire shine'] },
  { tier: 'Ultimate',  price: 39.99, washes_per_month: 999, perks: ['Unlimited washes', 'Interior vacuum', 'Wax'] },
  { tier: 'Fleet',     price: 99.99, washes_per_month: 50, perks: ['Multi-vehicle', 'Priority bay'] },
];
const memStore = new Map(MEM_DEFAULTS.map(m => [m.tier, { ...m }]));

router.get('/membership-pricing', authMiddleware, (req, res) => {
  res.json({ tiers: Array.from(memStore.values()) });
});

router.put('/membership-pricing', authMiddleware, (req, res) => {
  try {
    const updates = Array.isArray(req.body?.tiers) ? req.body.tiers : null;
    if (!updates) return res.status(400).json({ error: 'Body must include {tiers: [...]}' });
    updates.forEach(t => {
      if (!t || !t.tier) return;
      const cur = memStore.get(t.tier) || { tier: t.tier, perks: [] };
      memStore.set(t.tier, {
        tier: t.tier,
        price: Number(t.price) >= 0 ? Number(t.price) : cur.price,
        washes_per_month: Number(t.washes_per_month) >= 0 ? Number(t.washes_per_month) : cur.washes_per_month,
        perks: Array.isArray(t.perks) ? t.perks : (cur.perks || []),
      });
    });
    res.json({ ok: true, tiers: Array.from(memStore.values()) });
  } catch (err) {
    res.status(500).json({ error: 'membership-pricing update failed', details: String(err.message || err) });
  }
});

router.get('/health', (req, res) => res.json({ ok: true, feature: 'custom-views' }));

// ============================================================
// === BATCH 2: 4 NEW Custom Views (2 VIZ + 2 NON-VIZ) ===
// ============================================================

// ---------------- NEW VIZ 1: Bay utilization timeline ----------------
// Returns multi-bay 24h utilization (0..1) trace with peaks tagged.
router.get('/bay-utilization-timeline', authMiddleware, async (req, res) => {
  try {
    const locationId = parseInt(req.query.location_id || '1', 10);
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const rnd = seededRand(40113 + locationId * 31 + (Date.parse(date) || 0) % 9973);
    const bays = ['Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5'];
    // 24 hourly buckets (0..23)
    const hours = Array.from({ length: 24 }, (_, h) => h);
    const series = bays.map((bay, bi) => {
      const samples = hours.map((h) => {
        // demand curve: low overnight, rising mid-morning, peak lunch and 5pm
        const baseCurve =
          h < 6 ? 0.04 :
          h < 9 ? 0.25 + rnd() * 0.15 :
          h < 11 ? 0.45 + rnd() * 0.15 :
          h === 12 ? 0.78 + rnd() * 0.15 :
          h < 16 ? 0.55 + rnd() * 0.18 :
          h === 17 ? 0.82 + rnd() * 0.15 :
          h < 20 ? 0.5 + rnd() * 0.2 :
          h < 22 ? 0.18 + rnd() * 0.1 :
          0.05;
        const jitter = (rnd() - 0.5) * 0.08;
        const u = Math.max(0, Math.min(1, baseCurve + jitter - bi * 0.03));
        return { hour: h, utilization: +u.toFixed(3) };
      });
      const peakHour = samples.reduce((a, b) => (b.utilization > a.utilization ? b : a)).hour;
      const avg = +(samples.reduce((s, p) => s + p.utilization, 0) / samples.length).toFixed(3);
      return { bay, peak_hour: peakHour, avg_utilization: avg, samples };
    });
    const chain_avg = +(series.reduce((s, b) => s + b.avg_utilization, 0) / series.length).toFixed(3);
    res.json({ location_id: locationId, date, hours, series, chain_avg });
  } catch (err) {
    res.status(500).json({ error: 'bay-utilization-timeline failed', details: String(err.message || err) });
  }
});

// ---------------- NEW VIZ 2: Location performance heatmap ----------------
// Returns 2D matrix of locations × KPIs scored 0..100 for heatmap rendering.
router.get('/location-performance-heatmap', authMiddleware, async (req, res) => {
  try {
    const kpis = ['Revenue', 'Throughput', 'Avg Ticket', 'Member Conv.', 'NPS', 'Uptime'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
    let locs = [];
    if (dbPool) {
      try {
        const r = await dbPool.query('SELECT id, name, city FROM locations LIMIT 12');
        locs = r.rows || [];
      } catch (_) {}
    }
    if (!locs.length) {
      locs = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `SparkleWash #${100 + i}`,
        city: cities[i % cities.length],
      }));
    }
    const rnd = seededRand(77321);
    const rows = locs.map((loc) => {
      const scores = kpis.map(() => Math.round(35 + rnd() * 60));
      const composite = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return {
        location_id: loc.id,
        name: loc.name,
        city: loc.city || cities[loc.id % cities.length],
        scores,
        composite,
      };
    });
    rows.sort((a, b) => b.composite - a.composite);
    res.json({ kpis, rows, scale: { min: 0, max: 100 } });
  } catch (err) {
    res.status(500).json({ error: 'location-performance-heatmap failed', details: String(err.message || err) });
  }
});

// ---------------- NEW NON-VIZ 1: Shift report PDF ----------------
// Different from shift-schedule.pdf above: this is a daily REPORT with labor cost, washes/hr, vs target.
router.get('/shift-report.pdf', authMiddleware, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const locationName = req.query.location || 'SparkleWash #101';
    const rnd = seededRand((Date.parse(date) || 9911) + locationName.length);
    const shifts = [
      { name: 'Open 6a-2p', staff: 4, hours: 8 },
      { name: 'Mid 10a-6p', staff: 5, hours: 8 },
      { name: 'Close 2p-10p', staff: 4, hours: 8 },
    ];
    const rows = shifts.map((s) => {
      const washes = Math.round(120 + rnd() * 200);
      const wph = +(washes / s.hours).toFixed(1);
      const laborCost = +(s.staff * s.hours * 18.5).toFixed(2);
      const revenue = +(washes * (12 + rnd() * 8)).toFixed(2);
      const target = 30; // target washes/hr
      const variance = +((wph - target) / target * 100).toFixed(1);
      return { ...s, washes, wph, laborCost, revenue, target, variance };
    });
    const totals = {
      washes: rows.reduce((a, b) => a + b.washes, 0),
      laborCost: +(rows.reduce((a, b) => a + b.laborCost, 0)).toFixed(2),
      revenue: +(rows.reduce((a, b) => a + b.revenue, 0)).toFixed(2),
    };
    totals.margin = +(((totals.revenue - totals.laborCost) / totals.revenue) * 100).toFixed(1);

    const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="shift-report-${date}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).fillColor('#0f172a').text('SparkleWash - Daily Shift Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#475569').text(`Location: ${locationName}    Date: ${date}`, { align: 'center' });
    doc.moveDown(1);

    // KPI summary band
    doc.fontSize(12).fillColor('#0f172a').text('Daily KPI Summary', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#334155').text(`Total Washes: ${totals.washes}`);
    doc.text(`Total Labor Cost: $${totals.laborCost.toFixed(2)}`);
    doc.text(`Total Revenue: $${totals.revenue.toFixed(2)}`);
    doc.text(`Gross Margin: ${totals.margin}%`);
    doc.moveDown(0.8);

    // Per-shift table
    const startX = 40;
    let y = doc.y;
    const colWidths = [120, 50, 60, 70, 90, 90, 60];
    const headers = ['Shift', 'Staff', 'Washes', 'Washes/hr', 'Labor Cost ($)', 'Revenue ($)', 'vs Tgt'];
    doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 22).fill('#1e3a5f');
    let x = startX;
    headers.forEach((h, i) => {
      doc.fillColor('#ffffff').fontSize(10).text(h, x + 6, y + 6, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });
    y += 22;
    rows.forEach((r, ri) => {
      if (ri % 2 === 0) {
        doc.rect(startX, y, colWidths.reduce((a, b) => a + b, 0), 22).fill('#f1f5f9');
      }
      x = startX;
      const cells = [r.name, String(r.staff), String(r.washes), String(r.wph), r.laborCost.toFixed(2), r.revenue.toFixed(2), `${r.variance > 0 ? '+' : ''}${r.variance}%`];
      cells.forEach((c, ci) => {
        const color = ci === 6 ? (r.variance >= 0 ? '#15803d' : '#b91c1c') : '#0f172a';
        doc.fillColor(color).fontSize(10).text(c, x + 6, y + 7, { width: colWidths[ci] - 8 });
        x += colWidths[ci];
      });
      y += 22;
    });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#64748b').text(
      'Auto-generated by SparkleWash Wash Views. Target = 30 washes/hr. Labor rate = $18.50/hr.',
      40, y + 16, { align: 'center', width: 530 }
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'shift-report failed', details: String(err.message || err) });
  }
});

// ---------------- NEW NON-VIZ 2: Pricing/Promo rules editor (CRUD) ----------------
// Distinct from membership pricing: per-promo CRUD with code/discount/effective dates.
let promoIdSeq = 4;
const promoStore = new Map([
  [1, { id: 1, code: 'SPARKLE10', description: '10% off any wash', discount_pct: 10, active: true, valid_from: '2025-01-01', valid_to: '2025-12-31' }],
  [2, { id: 2, code: 'FLEET25',   description: 'Fleet plan 25% off first month', discount_pct: 25, active: true, valid_from: '2025-03-01', valid_to: '2025-09-30' }],
  [3, { id: 3, code: 'RAINYDAY',  description: 'Rainy-day -15%', discount_pct: 15, active: false, valid_from: '2025-04-01', valid_to: '2025-06-30' }],
]);

router.get('/promo-rules', authMiddleware, (req, res) => {
  res.json({ rules: Array.from(promoStore.values()).sort((a, b) => a.id - b.id) });
});

router.post('/promo-rules', authMiddleware, (req, res) => {
  try {
    const b = req.body || {};
    if (!b.code || typeof b.code !== 'string') return res.status(400).json({ error: 'code (string) required' });
    promoIdSeq += 1;
    const rule = {
      id: promoIdSeq,
      code: String(b.code).toUpperCase().slice(0, 24),
      description: String(b.description || ''),
      discount_pct: Number.isFinite(+b.discount_pct) ? Math.max(0, Math.min(100, +b.discount_pct)) : 0,
      active: !!b.active,
      valid_from: b.valid_from || new Date().toISOString().slice(0, 10),
      valid_to: b.valid_to || new Date().toISOString().slice(0, 10),
    };
    promoStore.set(rule.id, rule);
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: 'promo-rules create failed', details: String(err.message || err) });
  }
});

router.put('/promo-rules/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const cur = promoStore.get(id);
    if (!cur) return res.status(404).json({ error: 'not found' });
    const b = req.body || {};
    const next = {
      ...cur,
      code: b.code ? String(b.code).toUpperCase().slice(0, 24) : cur.code,
      description: b.description != null ? String(b.description) : cur.description,
      discount_pct: Number.isFinite(+b.discount_pct) ? Math.max(0, Math.min(100, +b.discount_pct)) : cur.discount_pct,
      active: typeof b.active === 'boolean' ? b.active : cur.active,
      valid_from: b.valid_from || cur.valid_from,
      valid_to: b.valid_to || cur.valid_to,
    };
    promoStore.set(id, next);
    res.json(next);
  } catch (err) {
    res.status(500).json({ error: 'promo-rules update failed', details: String(err.message || err) });
  }
});

router.delete('/promo-rules/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const had = promoStore.delete(id);
    if (!had) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: 'promo-rules delete failed', details: String(err.message || err) });
  }
});

module.exports = router;
