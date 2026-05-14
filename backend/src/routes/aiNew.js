const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const SYSTEM_PROMPT = 'You are an AI car wash operations optimization expert. Analyze operational data and provide actionable recommendations for demand, staffing, maintenance, and revenue optimization.';

// Ensure ai_results table exists (idempotent)
async function ensureAIResultsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_results (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER,
      endpoint     VARCHAR(255) NOT NULL,
      request_data JSONB,
      result_data  JSONB,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ai_results_user_id ON ai_results(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_results_endpoint ON ai_results(endpoint);
    CREATE INDEX IF NOT EXISTS idx_ai_results_created_at ON ai_results(created_at DESC);
  `);
}

ensureAIResultsTable().catch(err => console.error('ai_results init error:', err.message));

async function saveAIResult(userId, endpoint, requestData, result) {
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, request_data, result_data) VALUES ($1, $2, $3, $4)`,
      [userId || null, endpoint, JSON.stringify(requestData), JSON.stringify(result)]
    );
  } catch (_) {}
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function callAI(userPrompt, attempt = 1) {
  const extraInstruction = attempt > 1
    ? '\n\nCRITICAL: Your response MUST be valid JSON only. No markdown, no explanation, no backticks. Start with { and end with }.'
    : '';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'AI Car Wash Chain Optimizer'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\nAlways respond with valid JSON only. No markdown fences.' },
        { role: 'user', content: userPrompt + extraInstruction }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter API error');

  const raw = data.choices[0].message.content.trim();
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    if (attempt < 2) {
      console.warn('[AINew] JSON parse failed on attempt 1, retrying...');
      return callAI(userPrompt, 2);
    }
    throw Object.assign(new Error('AI response was not valid JSON after retry'), {
      rawResponse: cleaned,
      parseError: parseErr.message
    });
  }
}

function validateRequired(body, fields) {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  return missing;
}

function handleAIError(res, err) {
  console.error('[AINew Route Error]', err.message);
  if (err.rawResponse) {
    return res.status(200).json({
      error: 'AI returned invalid JSON',
      parseError: err.parseError,
      rawResponse: err.rawResponse
    });
  }
  return res.status(500).json({ error: err.message });
}

// Apply auth + rate limiter to all routes in this file
router.use(authMiddleware);
router.use(aiRateLimiter);

// ─── 1. Price Elasticity Analysis ────────────────────────────────────────────

router.post('/price-elasticity', async (req, res) => {
  try {
    const { location_id, price_history, demand_history } = req.body;
    const missing = validateRequired(req.body, ['location_id', 'price_history', 'demand_history']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    if (!Array.isArray(price_history) || !Array.isArray(demand_history)) {
      return res.status(400).json({ error: 'price_history and demand_history must be arrays' });
    }

    const locationResult = await pool.query('SELECT * FROM locations WHERE id = $1', [location_id]);
    if (locationResult.rows.length === 0) return res.status(404).json({ error: 'Location not found' });

    const prompt = `Analyze price elasticity and demand curve for a car wash location.

Location: ${JSON.stringify(locationResult.rows[0])}
Price History: ${JSON.stringify(price_history)}
Demand History: ${JSON.stringify(demand_history)}

Provide a JSON response:
{
  "elasticity_coefficient": number,
  "elasticity_interpretation": "inelastic/elastic/unit-elastic with explanation",
  "demand_curve": [{"price_point": number, "estimated_demand": number, "revenue": number}],
  "optimal_price_points": [{"service": "name", "current_price": number, "optimal_price": number, "expected_demand_change": "percentage", "revenue_impact": number, "rationale": "why"}],
  "revenue_maximizing_price": number,
  "market_segments": [{"segment": "budget/value/premium", "price_range": "min-max", "strategy": "recommendation"}],
  "competitive_positioning": "How pricing positions us vs competitors",
  "implementation_plan": ["step 1", "step 2"],
  "risk_assessment": "Risks of pricing changes"
}`;

    try {
      const result = await callAI(prompt);
      await saveAIResult(req.user?.id, 'price-elasticity', req.body, result);
      res.json({ analysis: result, type: 'price_elasticity', location_id });
    } catch (aiErr) {
      handleAIError(res, aiErr);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. Competitor Benchmarking ───────────────────────────────────────────────

router.post('/competitor-benchmarking', async (req, res) => {
  try {
    const { competitor_prices, reviews, our_data } = req.body;
    const missing = validateRequired(req.body, ['competitor_prices', 'reviews', 'our_data']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    if (!Array.isArray(competitor_prices) || !Array.isArray(reviews)) {
      return res.status(400).json({ error: 'competitor_prices and reviews must be arrays' });
    }

    const prompt = `Perform competitive benchmarking analysis for a car wash business.

Competitor Pricing: ${JSON.stringify(competitor_prices)}
Market Reviews: ${JSON.stringify(reviews)}
Our Business Data: ${JSON.stringify(our_data)}

Provide a JSON response:
{
  "competitive_position": "strong/average/weak with context",
  "market_share_estimate": "percentage estimate",
  "pricing_vs_competitors": [{"competitor": "name", "price_gap": number, "quality_perception": "higher/equal/lower", "advantage": "what we do better or worse"}],
  "differentiation_opportunities": [{"opportunity": "what", "implementation": "how", "expected_impact": "outcome"}],
  "loyalty_program_recommendations": [{"program": "name", "structure": "details", "target_segment": "who", "expected_retention_lift": "percentage"}],
  "service_gaps": ["gap 1 competitors offer that we don't"],
  "quick_wins": ["immediate action to improve competitive position"],
  "6_month_roadmap": ["milestone 1", "milestone 2"],
  "overall_strategy": "Summary competitive strategy recommendation"
}`;

    try {
      const result = await callAI(prompt);
      await saveAIResult(req.user?.id, 'competitor-benchmarking', req.body, result);
      res.json({ analysis: result, type: 'competitor_benchmarking' });
    } catch (aiErr) {
      handleAIError(res, aiErr);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. Employee Burnout Risk Assessment ──────────────────────────────────────

router.post('/employee-burnout', async (req, res) => {
  try {
    const { staff, hours_data, turnover_history } = req.body;
    const missing = validateRequired(req.body, ['staff', 'hours_data', 'turnover_history']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    if (!Array.isArray(staff) || !Array.isArray(hours_data) || !Array.isArray(turnover_history)) {
      return res.status(400).json({ error: 'staff, hours_data, and turnover_history must be arrays' });
    }

    const prompt = `Analyze employee burnout risk and provide scheduling recommendations for a car wash chain.

Staff Roster: ${JSON.stringify(staff)}
Hours Worked Data: ${JSON.stringify(hours_data)}
Turnover History: ${JSON.stringify(turnover_history)}

Provide a JSON response:
{
  "overall_burnout_risk": "low/medium/high/critical",
  "team_health_score": number,
  "individual_risk_scores": [{"employee_id": "id", "name": "name", "burnout_risk": "low/medium/high", "risk_score": number, "key_indicators": ["indicator 1"], "recommended_action": "what to do"}],
  "high_risk_employees": ["names of employees needing immediate attention"],
  "turnover_forecast": {"30_day": number, "90_day": number, "annual": number},
  "cost_of_turnover": number,
  "scheduling_recommendations": [{"recommendation": "what", "rationale": "why", "implementation": "how"}],
  "wellness_initiatives": [{"initiative": "program name", "description": "details", "estimated_cost": number, "expected_impact": "outcome"}],
  "workload_rebalancing": [{"from_employee": "name", "to_employee": "name", "tasks": ["task"]}],
  "recognition_suggestions": ["specific recognition action"]
}`;

    try {
      const result = await callAI(prompt);
      await saveAIResult(req.user?.id, 'employee-burnout', req.body, result);
      res.json({ analysis: result, type: 'employee_burnout' });
    } catch (aiErr) {
      handleAIError(res, aiErr);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. Seasonal Calendar & Event-Triggered Demand ────────────────────────────

router.post('/seasonal-calendar', async (req, res) => {
  try {
    const { historical_data, upcoming_events } = req.body;
    const missing = validateRequired(req.body, ['historical_data', 'upcoming_events']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    if (!Array.isArray(historical_data) || !Array.isArray(upcoming_events)) {
      return res.status(400).json({ error: 'historical_data and upcoming_events must be arrays' });
    }

    const prompt = `Generate a seasonal demand calendar with event-triggered forecasts for a car wash chain.

Historical Demand Data: ${JSON.stringify(historical_data)}
Upcoming Events: ${JSON.stringify(upcoming_events)}

Provide a JSON response:
{
  "seasonal_overview": "Summary of demand patterns throughout the year",
  "peak_seasons": [{"season": "name", "months": ["month"], "demand_multiplier": number, "key_drivers": ["driver"]}],
  "low_seasons": [{"season": "name", "months": ["month"], "demand_multiplier": number, "mitigation_strategies": ["strategy"]}],
  "event_impact_forecasts": [{"event": "name", "date": "YYYY-MM-DD", "demand_lift": "percentage", "affected_locations": ["location"], "preparation_needed": ["action"]}],
  "monthly_forecast": [{"month": "YYYY-MM", "predicted_cars": number, "revenue_estimate": number, "staffing_recommendation": "level"}],
  "promotional_calendar": [{"month": "YYYY-MM", "promotion": "name", "target": "audience", "expected_lift": "percentage"}],
  "inventory_planning": [{"period": "date range", "chemicals_needed": "estimate", "equipment_check": "recommendation"}],
  "holiday_playbook": [{"holiday": "name", "strategy": "operational recommendation", "revenue_opportunity": number}]
}`;

    try {
      const result = await callAI(prompt);
      await saveAIResult(req.user?.id, 'seasonal-calendar', req.body, result);
      res.json({ analysis: result, type: 'seasonal_calendar' });
    } catch (aiErr) {
      handleAIError(res, aiErr);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 5. Expansion ROI Analysis ────────────────────────────────────────────────

router.post('/expansion-roi', async (req, res) => {
  try {
    const { location_proposal, demographics, competitors } = req.body;
    const missing = validateRequired(req.body, ['location_proposal', 'demographics', 'competitors']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    if (!Array.isArray(competitors)) {
      return res.status(400).json({ error: 'competitors must be an array' });
    }

    const prompt = `Perform a 5-year ROI analysis for a proposed car wash expansion location.

Location Proposal: ${JSON.stringify(location_proposal)}
Demographics Data: ${JSON.stringify(demographics)}
Nearby Competitors: ${JSON.stringify(competitors)}

Provide a JSON response:
{
  "site_score": number,
  "site_assessment": "Overall viability assessment",
  "market_opportunity": "Size and quality of market opportunity",
  "5_year_revenue_forecast": [{"year": 1, "revenue": number, "cars_served": number, "market_share": "percentage"}, {"year": 2, "revenue": number, "cars_served": number, "market_share": "percentage"}, {"year": 3, "revenue": number, "cars_served": number, "market_share": "percentage"}, {"year": 4, "revenue": number, "cars_served": number, "market_share": "percentage"}, {"year": 5, "revenue": number, "cars_served": number, "market_share": "percentage"}],
  "startup_costs": {"total": number, "breakdown": [{"item": "cost category", "amount": number}]},
  "payback_period_months": number,
  "roi_percentage": number,
  "npv": number,
  "irr_percentage": number,
  "breakeven_cars_per_day": number,
  "competitive_threats": [{"competitor": "name", "threat_level": "high/medium/low", "mitigation": "strategy"}],
  "success_factors": ["factor 1", "factor 2"],
  "risk_factors": [{"risk": "description", "probability": "high/medium/low", "mitigation": "action"}],
  "recommendation": "proceed/proceed_with_caution/do_not_proceed",
  "recommendation_rationale": "Detailed reasoning"
}`;

    try {
      const result = await callAI(prompt);
      await saveAIResult(req.user?.id, 'expansion-roi', req.body, result);
      res.json({ analysis: result, type: 'expansion_roi' });
    } catch (aiErr) {
      handleAIError(res, aiErr);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 6. Water/Chemical Waste Tracker ──────────────────────────────────────────

router.post('/water-waste-tracker', async (req, res) => {
  try {
    const { sensor_data, location_id, time_period_days } = req.body;
    const missing = validateRequired(req.body, ['sensor_data', 'location_id']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    if (!Array.isArray(sensor_data)) return res.status(400).json({ error: 'sensor_data must be an array' });

    let location = null;
    try {
      const r = await pool.query('SELECT * FROM locations WHERE id = $1', [location_id]);
      location = r.rows[0] || null;
    } catch (_) {}

    const prompt = `Analyze water and chemical waste from sensor data; predict overflows, alert maintenance, and quantify environmental impact.

Location: ${JSON.stringify(location)}
Time Period (days): ${time_period_days || 30}
Sensor Data (water meter, chemical levels, drainage flow): ${JSON.stringify(sensor_data).slice(0, 5000)}

Provide a JSON response:
{
  "waste_summary": { "water_gallons_wasted": number, "chemicals_wasted_dollars": number, "co2_equivalent_kg": number },
  "anomalies": [{ "timestamp": "ISO", "type": "overflow|leak|spike", "severity": "low|medium|high|critical", "location_zone": string, "estimated_loss": number }],
  "predicted_failures": [{ "system": string, "probability_pct": number, "expected_window": string, "preventive_action": string }],
  "maintenance_alerts": [{ "priority": "immediate|24h|week", "action": string, "assigned_team": string }],
  "environmental_impact": { "water_savings_potential_pct": number, "carbon_reduction_kg": number, "compliance_risk": "none|minor|moderate|severe" },
  "cost_savings_projection": { "monthly_dollars": number, "annual_dollars": number, "payback_months": number },
  "recommendations": [{ "category": string, "action": string, "expected_savings": number }],
  "compliance_notes": [string]
}`;

    try {
      const result = await callAI(prompt);
      await saveAIResult(req.user?.id, 'water-waste-tracker', req.body, result);
      res.json({ analysis: result, type: 'water_waste_tracker', location_id });
    } catch (aiErr) {
      handleAIError(res, aiErr);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 7. Customer Lifetime Value Segmentation ──────────────────────────────────

router.post('/customer-ltv-segmentation', async (req, res) => {
  try {
    const { customers } = req.body;
    const missing = validateRequired(req.body, ['customers']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ error: 'customers must be a non-empty array' });
    }

    const prompt = `Cluster customers into LTV segments and recommend personalized retention offers for a car wash chain.

Customers (id, total_spent, visits, recency_days, plan, churn_risk): ${JSON.stringify(customers).slice(0, 6000)}

Provide a JSON response:
{
  "segments": [
    {
      "name": "Champions|Loyal|Potential|At-Risk|Hibernating|Lost",
      "customer_count": number,
      "avg_ltv": number,
      "avg_visits_per_month": number,
      "characteristics": [string],
      "retention_offer": { "type": "discount|free_service|loyalty_points|membership_upgrade", "value": string, "expected_response_rate_pct": number },
      "messaging_template": string,
      "channel": "email|sms|push|in-person",
      "customer_ids": [number]
    }
  ],
  "high_value_at_risk": [{ "customer_id": number, "ltv": number, "churn_risk_pct": number, "intervention": string }],
  "upsell_candidates": [{ "customer_id": number, "current_plan": string, "recommended_plan": string, "expected_uplift": number }],
  "campaign_calendar": [{ "month": string, "segment": string, "campaign": string, "budget": number, "expected_revenue": number }],
  "overall_strategy": string
}`;

    try {
      const result = await callAI(prompt);
      await saveAIResult(req.user?.id, 'customer-ltv-segmentation', req.body, result);
      res.json({ analysis: result, type: 'customer_ltv_segmentation' });
    } catch (aiErr) {
      handleAIError(res, aiErr);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 8. Supply Chain Optimization ─────────────────────────────────────────────

router.post('/supply-chain', async (req, res) => {
  try {
    const { usage_history, current_inventory, suppliers } = req.body;
    const missing = validateRequired(req.body, ['usage_history', 'current_inventory']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    if (!Array.isArray(usage_history) || !Array.isArray(current_inventory)) {
      return res.status(400).json({ error: 'usage_history and current_inventory must be arrays' });
    }

    const prompt = `Optimize chemical/equipment supply chain for a car wash chain. Predict reorder times, evaluate bulk discounts, set optimal inventory levels.

Usage History (last 90 days): ${JSON.stringify(usage_history).slice(0, 5000)}
Current Inventory: ${JSON.stringify(current_inventory).slice(0, 3000)}
Suppliers (optional): ${JSON.stringify(suppliers || [])}

Provide a JSON response:
{
  "reorder_plan": [
    { "sku": string, "name": string, "current_qty": number, "reorder_point": number, "optimal_order_qty": number, "supplier": string, "expected_delivery_days": number, "order_by_date": "YYYY-MM-DD", "priority": "low|medium|high|urgent" }
  ],
  "bulk_discount_opportunities": [
    { "sku": string, "supplier": string, "current_unit_cost": number, "bulk_unit_cost": number, "min_qty": number, "annual_savings": number, "carrying_cost_increase": number, "recommended": boolean }
  ],
  "inventory_health": { "stockout_risk_skus": [string], "overstock_skus": [string], "turnover_rate": number, "days_inventory_on_hand": number },
  "supplier_performance": [{ "supplier": string, "on_time_pct": number, "quality_score": number, "lead_time_days": number, "recommendation": "preferred|acceptable|review|drop" }],
  "consolidation_opportunities": [{ "current_skus": [string], "proposed_sku": string, "savings": number, "tradeoff": string }],
  "annual_savings_projection": number,
  "key_recommendations": [string]
}`;

    try {
      const result = await callAI(prompt);
      await saveAIResult(req.user?.id, 'supply-chain', req.body, result);
      res.json({ analysis: result, type: 'supply_chain' });
    } catch (aiErr) {
      handleAIError(res, aiErr);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI Run History (Paginated) ───────────────────────────────────────────────

router.get('/results', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const endpoint = req.query.endpoint || null;

    const where = endpoint ? 'WHERE endpoint = $1' : '';
    const params = endpoint ? [endpoint] : [];

    const countResult = await pool.query(`SELECT COUNT(*) FROM ai_results ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT id, user_id, endpoint, request_data, result_data, created_at FROM ai_results ${where}
       ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Feedback (rate / flag AI responses) ─────────────────────────────────────

async function ensureFeedbackTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_feedback (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER,
      endpoint     VARCHAR(255),
      rating       INTEGER CHECK (rating >= 1 AND rating <= 5),
      flagged      BOOLEAN DEFAULT FALSE,
      flag_reason  TEXT,
      comment      TEXT,
      request_data JSONB,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
ensureFeedbackTable().catch(err => console.error('feedback init error:', err.message));

router.post('/feedback', async (req, res) => {
  try {
    const { rating, endpoint, flagged, flag_reason, comment, request_data } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1-5' });
    const result = await pool.query(
      `INSERT INTO ai_feedback (user_id, endpoint, rating, flagged, flag_reason, comment, request_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user?.id || null, endpoint || null, rating, flagged || false, flag_reason || null, comment || null,
       request_data ? JSON.stringify(request_data) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
