const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { fetchWeatherForecast } = require('../services/weatherService');
const auth = require('../middleware/auth');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';
const SYSTEM_PROMPT = 'You are an AI car wash operations optimization expert. Analyze operational data and provide actionable recommendations for demand, staffing, maintenance, and revenue optimization.';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Call OpenRouter and return parsed JSON. Retries once with explicit JSON instruction on parse failure.
 */
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
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    if (attempt < 2) {
      console.warn('[AI] JSON parse failed on attempt 1, retrying with explicit instruction...');
      return callAI(userPrompt, 2);
    }
    // Return structured error with raw text so the caller still gets something useful
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

function handleAIError(res, err, fallback) {
  console.error('[AI Route Error]', err.message);
  if (err.rawResponse) {
    return res.status(200).json({
      error: 'AI returned invalid JSON',
      parseError: err.parseError,
      rawResponse: err.rawResponse,
      fallback
    });
  }
  return res.status(500).json({ error: err.message, fallback });
}

// Apply rate limiter to all AI routes
router.use(auth, aiRateLimiter);

// ─── 1. Weather Demand Forecasting (uses live weather when available) ────────

router.post('/weather-forecast', async (req, res) => {
  try {
    const { location_id } = req.body;
    const missing = validateRequired(req.body, ['location_id']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const locationResult = await pool.query('SELECT * FROM locations WHERE id = $1', [location_id]);
    if (locationResult.rows.length === 0) return res.status(404).json({ error: 'Location not found' });

    const revenue = await pool.query('SELECT * FROM revenue_analytics WHERE location_id = $1 ORDER BY date DESC LIMIT 7', [location_id]);

    // Use live weather when available, fall back to DB
    const weatherData = await fetchWeatherForecast(location_id);

    const prompt = `Analyze the following data and provide a detailed demand forecast for a car wash location.

Location: ${JSON.stringify(locationResult.rows[0])}
Weather Forecasts (source: ${weatherData.source}): ${JSON.stringify(weatherData.data)}
Recent Revenue: ${JSON.stringify(revenue.rows)}

Provide a JSON response with this structure:
{
  "forecast_summary": "Brief overview",
  "weather_data_source": "${weatherData.source}",
  "daily_predictions": [{"date": "YYYY-MM-DD", "predicted_cars": number, "confidence": number, "demand_level": "high/medium/low", "reasoning": "why"}],
  "recommendations": ["actionable recommendation 1", "recommendation 2"],
  "revenue_impact": "Expected revenue impact description",
  "staffing_suggestion": "Staffing adjustment suggestion",
  "risk_factors": ["risk 1", "risk 2"]
}`;

    try {
      const result = await callAI(prompt);
      res.json({ analysis: result, type: 'weather_forecast', weather_source: weatherData.source });
    } catch (aiErr) {
      handleAIError(res, aiErr, { weather_source: weatherData.source });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. Chemical Dosing Optimization ────────────────────────────────────────

router.post('/chemical-dosing', async (req, res) => {
  try {
    const { location_id } = req.body;
    const missing = validateRequired(req.body, ['location_id']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const dosing = await pool.query(
      'SELECT cd.*, c.name as chemical_name, c.type as chemical_type FROM chemical_dosing cd JOIN chemicals c ON cd.chemical_id = c.id WHERE cd.location_id = $1',
      [location_id]
    );
    const chemicals = await pool.query('SELECT * FROM chemicals WHERE location_id = $1', [location_id]);

    const prompt = `Analyze chemical dosing data for a car wash and provide optimization recommendations.

Chemical Inventory: ${JSON.stringify(chemicals.rows)}
Dosing History: ${JSON.stringify(dosing.rows)}

Provide a JSON response:
{
  "optimization_summary": "Overview of current chemical usage efficiency",
  "chemical_adjustments": [{"chemical": "name", "current_dosage": number, "recommended_dosage": number, "change_percent": number, "reason": "why"}],
  "cost_savings": "Estimated monthly savings",
  "quality_impact": "Impact on wash quality",
  "environmental_notes": "Environmental considerations",
  "reorder_alerts": [{"chemical": "name", "days_until_reorder": number, "priority": "high/medium/low"}]
}`;

    try {
      const result = await callAI(prompt);
      res.json({ analysis: result, type: 'chemical_dosing' });
    } catch (aiErr) {
      handleAIError(res, aiErr, null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. Equipment Maintenance Prediction ────────────────────────────────────

router.post('/maintenance-prediction', async (req, res) => {
  try {
    const { equipment_id } = req.body;
    const missing = validateRequired(req.body, ['equipment_id']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const equipment = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    if (equipment.rows.length === 0) return res.status(404).json({ error: 'Equipment not found' });
    const predictions = await pool.query(
      'SELECT * FROM maintenance_predictions WHERE equipment_id = $1 ORDER BY created_at DESC',
      [equipment_id]
    );

    const prompt = `Analyze equipment data and predict maintenance needs for a car wash.

Equipment: ${JSON.stringify(equipment.rows[0])}
Maintenance History: ${JSON.stringify(predictions.rows)}

Provide a JSON response:
{
  "health_assessment": "Overall equipment health summary",
  "risk_score": number,
  "predicted_failure_window": "Date range",
  "maintenance_schedule": [{"action": "what to do", "urgency": "immediate/soon/scheduled", "estimated_cost": number, "downtime_hours": number}],
  "parts_to_order": [{"part": "name", "quantity": number, "lead_time_days": number}],
  "efficiency_rating": "Current operational efficiency",
  "lifecycle_position": "Where equipment is in its lifecycle"
}`;

    try {
      const result = await callAI(prompt);
      res.json({ analysis: result, type: 'maintenance_prediction' });
    } catch (aiErr) {
      handleAIError(res, aiErr, null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. Smart Staffing Optimization ─────────────────────────────────────────

router.post('/staffing-optimization', async (req, res) => {
  try {
    const { location_id, date } = req.body;
    const missing = validateRequired(req.body, ['location_id']);
    if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    const employees = await pool.query(
      "SELECT * FROM employees WHERE location_id = $1 AND status = 'active'",
      [location_id]
    );
    const schedules = await pool.query(
      'SELECT * FROM staffing_schedules WHERE location_id = $1 ORDER BY date DESC LIMIT 15',
      [location_id]
    );
    const targetDate = date || new Date().toISOString().split('T')[0];
    const weather = await pool.query(
      'SELECT * FROM weather_forecasts WHERE location_id = $1 AND forecast_date >= $2 LIMIT 3',
      [location_id, targetDate]
    );

    const prompt = `Create an optimal staffing plan for a car wash location.

Available Employees: ${JSON.stringify(employees.rows)}
Recent Schedules: ${JSON.stringify(schedules.rows)}
Weather Forecast: ${JSON.stringify(weather.rows)}

Provide a JSON response:
{
  "staffing_plan": "Overview of recommended staffing",
  "shifts": [{"shift": "morning/afternoon/evening", "staff_count": number, "employees": ["name1", "name2"], "reason": "why this configuration"}],
  "total_labor_cost": number,
  "cost_vs_revenue": "Labor cost as percentage of expected revenue",
  "overtime_alerts": ["employee needing overtime consideration"],
  "cross_training_opportunities": ["suggestion for skill development"],
  "efficiency_score": number
}`;

    try {
      const result = await callAI(prompt);
      res.json({ analysis: result, type: 'staffing_optimization' });
    } catch (aiErr) {
      handleAIError(res, aiErr, null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 5. Membership Churn Prediction ─────────────────────────────────────────

router.post('/churn-prediction', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const memberships = await pool.query(
      'SELECT m.*, l.name as location_name FROM memberships m LEFT JOIN locations l ON m.location_id = l.id ORDER BY m.churn_risk DESC LIMIT $1 OFFSET $2',
      [Number(limit), offset]
    );

    const prompt = `Analyze membership data and predict churn risk for a car wash chain.

Memberships: ${JSON.stringify(memberships.rows)}

Provide a JSON response:
{
  "churn_overview": "Summary of churn risk across the chain",
  "at_risk_members": [{"name": "member name", "risk_score": number, "risk_factors": ["factor1"], "retention_strategy": "what to do"}],
  "retention_campaigns": [{"campaign": "name", "target_segment": "who", "expected_impact": "description", "cost": number}],
  "monthly_churn_forecast": number,
  "revenue_at_risk": number,
  "top_churn_drivers": ["driver1", "driver2"]
}`;

    try {
      const result = await callAI(prompt);
      res.json({ analysis: result, type: 'churn_prediction' });
    } catch (aiErr) {
      handleAIError(res, aiErr, null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 6. Revenue Optimization ─────────────────────────────────────────────────

router.post('/revenue-optimization', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const revenue = await pool.query(
      'SELECT ra.*, l.name as location_name FROM revenue_analytics ra JOIN locations l ON ra.location_id = l.id ORDER BY ra.date DESC LIMIT $1 OFFSET $2',
      [Number(limit), offset]
    );
    const packages = await pool.query("SELECT * FROM service_packages WHERE status = 'active'");

    const prompt = `Analyze revenue data and suggest optimizations for a car wash chain.

Revenue Data: ${JSON.stringify(revenue.rows)}
Service Packages: ${JSON.stringify(packages.rows)}

Provide a JSON response:
{
  "revenue_overview": "Chain-wide revenue summary",
  "location_rankings": [{"location": "name", "performance": "above/below average", "suggestion": "improvement tip"}],
  "pricing_recommendations": [{"service": "name", "current_price": number, "suggested_price": number, "expected_impact": "description"}],
  "upsell_opportunities": [{"from_service": "basic", "to_service": "premium", "conversion_rate": "expected %", "additional_revenue": number}],
  "promotional_ideas": [{"promotion": "description", "target": "audience", "timing": "when", "expected_roi": number}],
  "monthly_forecast": number
}`;

    try {
      const result = await callAI(prompt);
      res.json({ analysis: result, type: 'revenue_optimization' });
    } catch (aiErr) {
      handleAIError(res, aiErr, null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 7. Customer Sentiment Analysis ──────────────────────────────────────────

router.post('/sentiment-analysis', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const feedback = await pool.query(
      'SELECT cf.*, c.name as customer_name, l.name as location_name FROM customer_feedback cf LEFT JOIN customers c ON cf.customer_id = c.id LEFT JOIN locations l ON cf.location_id = l.id ORDER BY cf.created_at DESC LIMIT $1 OFFSET $2',
      [Number(limit), offset]
    );

    const prompt = `Analyze customer feedback for a car wash chain and provide sentiment analysis.

Customer Feedback: ${JSON.stringify(feedback.rows)}

Provide a JSON response:
{
  "sentiment_overview": "Overall customer sentiment summary",
  "average_sentiment": number,
  "sentiment_trend": "improving/stable/declining",
  "top_praise_themes": [{"theme": "what customers love", "frequency": number, "example": "quote"}],
  "top_complaint_themes": [{"theme": "common issue", "frequency": number, "severity": "high/medium/low", "suggested_fix": "action"}],
  "location_sentiment": [{"location": "name", "score": number, "highlights": "key point"}],
  "action_items": [{"priority": "high/medium/low", "action": "what to do", "expected_impact": "result"}],
  "nps_estimate": number
}`;

    try {
      const result = await callAI(prompt);
      res.json({ analysis: result, type: 'sentiment_analysis' });
    } catch (aiErr) {
      handleAIError(res, aiErr, null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 8. Energy Usage Optimization ────────────────────────────────────────────

router.post('/energy-optimization', async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const energy = await pool.query(
      'SELECT eu.*, l.name as location_name FROM energy_usage eu JOIN locations l ON eu.location_id = l.id ORDER BY eu.date DESC LIMIT $1 OFFSET $2',
      [Number(limit), offset]
    );

    const prompt = `Analyze energy consumption data for a car wash chain and provide optimization recommendations.

Energy Usage Data: ${JSON.stringify(energy.rows)}

Provide a JSON response:
{
  "energy_overview": "Chain-wide energy consumption summary",
  "total_monthly_cost": number,
  "efficiency_rankings": [{"location": "name", "cost_per_car": number, "rating": "excellent/good/needs improvement"}],
  "optimization_opportunities": [{"location": "name", "opportunity": "description", "estimated_savings": number, "implementation_cost": number, "payback_months": number}],
  "water_conservation": {"current_usage": "gallons/day", "reduction_target": "percentage", "methods": ["method1"]},
  "renewable_energy_recommendations": [{"recommendation": "what", "location": "where", "roi_years": number}],
  "sustainability_score": number
}`;

    try {
      const result = await callAI(prompt);
      res.json({ analysis: result, type: 'energy_optimization' });
    } catch (aiErr) {
      handleAIError(res, aiErr, null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
