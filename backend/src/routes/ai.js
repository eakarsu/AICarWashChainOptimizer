const express = require('express');
const router = express.Router();
const { queryAI } = require('../services/openrouter');
const pool = require('../db/connection');

// Weather Demand Forecasting
router.post('/weather-forecast', async (req, res) => {
  try {
    const { location_id } = req.body;
    const location = await pool.query('SELECT * FROM locations WHERE id = $1', [location_id]);
    const weather = await pool.query('SELECT * FROM weather_forecasts WHERE location_id = $1 ORDER BY forecast_date', [location_id]);
    const revenue = await pool.query('SELECT * FROM revenue_analytics WHERE location_id = $1 ORDER BY date DESC LIMIT 7', [location_id]);

    const prompt = `You are an AI car wash demand forecasting expert. Analyze the following data and provide a detailed demand forecast.

Location: ${JSON.stringify(location.rows[0])}
Weather Forecasts: ${JSON.stringify(weather.rows)}
Recent Revenue: ${JSON.stringify(revenue.rows)}

Provide a JSON response with this structure:
{
  "forecast_summary": "Brief overview",
  "daily_predictions": [{"date": "YYYY-MM-DD", "predicted_cars": number, "confidence": number, "demand_level": "high/medium/low", "reasoning": "why"}],
  "recommendations": ["actionable recommendation 1", "recommendation 2"],
  "revenue_impact": "Expected revenue impact description",
  "staffing_suggestion": "Staffing adjustment suggestion",
  "risk_factors": ["risk 1", "risk 2"]
}`;

    const result = await queryAI(
      'You are a car wash business analytics AI. Always respond with valid JSON only.',
      prompt
    );
    res.json({ analysis: result, type: 'weather_forecast' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chemical Dosing Optimization
router.post('/chemical-dosing', async (req, res) => {
  try {
    const { location_id } = req.body;
    const dosing = await pool.query('SELECT cd.*, c.name as chemical_name, c.type as chemical_type FROM chemical_dosing cd JOIN chemicals c ON cd.chemical_id = c.id WHERE cd.location_id = $1', [location_id]);
    const chemicals = await pool.query('SELECT * FROM chemicals WHERE location_id = $1', [location_id]);

    const prompt = `You are an AI chemical dosing optimization expert for car washes. Analyze the following data.

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

    const result = await queryAI(
      'You are a car wash chemical optimization AI. Always respond with valid JSON only.',
      prompt
    );
    res.json({ analysis: result, type: 'chemical_dosing' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Equipment Maintenance Prediction
router.post('/maintenance-prediction', async (req, res) => {
  try {
    const { equipment_id } = req.body;
    const equipment = await pool.query('SELECT * FROM equipment WHERE id = $1', [equipment_id]);
    const predictions = await pool.query('SELECT * FROM maintenance_predictions WHERE equipment_id = $1 ORDER BY created_at DESC', [equipment_id]);

    const prompt = `You are an AI predictive maintenance expert for car wash equipment. Analyze this equipment data.

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

    const result = await queryAI(
      'You are a car wash equipment maintenance AI. Always respond with valid JSON only.',
      prompt
    );
    res.json({ analysis: result, type: 'maintenance_prediction' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Smart Staffing Optimization
router.post('/staffing-optimization', async (req, res) => {
  try {
    const { location_id, date } = req.body;
    const employees = await pool.query('SELECT * FROM employees WHERE location_id = $1 AND status = $2', [location_id, 'active']);
    const schedules = await pool.query('SELECT * FROM staffing_schedules WHERE location_id = $1 ORDER BY date DESC LIMIT 15', [location_id]);
    const weather = await pool.query('SELECT * FROM weather_forecasts WHERE location_id = $1 AND forecast_date >= $2 LIMIT 3', [location_id, date || new Date().toISOString().split('T')[0]]);

    const prompt = `You are an AI staffing optimization expert for car washes. Create an optimal staffing plan.

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

    const result = await queryAI(
      'You are a car wash workforce optimization AI. Always respond with valid JSON only.',
      prompt
    );
    res.json({ analysis: result, type: 'staffing_optimization' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Membership Churn Prediction
router.post('/churn-prediction', async (req, res) => {
  try {
    const memberships = await pool.query('SELECT m.*, l.name as location_name FROM memberships m LEFT JOIN locations l ON m.location_id = l.id ORDER BY m.churn_risk DESC');

    const prompt = `You are an AI customer churn prediction expert. Analyze membership data and predict churn risk.

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

    const result = await queryAI(
      'You are a car wash membership retention AI. Always respond with valid JSON only.',
      prompt
    );
    res.json({ analysis: result, type: 'churn_prediction' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Revenue Optimization
router.post('/revenue-optimization', async (req, res) => {
  try {
    const revenue = await pool.query('SELECT ra.*, l.name as location_name FROM revenue_analytics ra JOIN locations l ON ra.location_id = l.id ORDER BY ra.date DESC');
    const packages = await pool.query('SELECT * FROM service_packages WHERE status = $1', ['active']);

    const prompt = `You are an AI revenue optimization expert for car wash chains. Analyze revenue data and suggest optimizations.

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

    const result = await queryAI(
      'You are a car wash revenue optimization AI. Always respond with valid JSON only.',
      prompt
    );
    res.json({ analysis: result, type: 'revenue_optimization' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Sentiment Analysis
router.post('/sentiment-analysis', async (req, res) => {
  try {
    const feedback = await pool.query('SELECT cf.*, c.name as customer_name, l.name as location_name FROM customer_feedback cf LEFT JOIN customers c ON cf.customer_id = c.id LEFT JOIN locations l ON cf.location_id = l.id ORDER BY cf.created_at DESC');

    const prompt = `You are an AI customer sentiment analysis expert. Analyze customer feedback for a car wash chain.

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

    const result = await queryAI(
      'You are a car wash customer sentiment AI. Always respond with valid JSON only.',
      prompt
    );
    res.json({ analysis: result, type: 'sentiment_analysis' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Energy Usage Optimization
router.post('/energy-optimization', async (req, res) => {
  try {
    const energy = await pool.query('SELECT eu.*, l.name as location_name FROM energy_usage eu JOIN locations l ON eu.location_id = l.id ORDER BY eu.date DESC');

    const prompt = `You are an AI energy optimization expert for car wash chains. Analyze energy consumption data.

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

    const result = await queryAI(
      'You are a car wash energy optimization AI. Always respond with valid JSON only.',
      prompt
    );
    res.json({ analysis: result, type: 'energy_optimization' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
