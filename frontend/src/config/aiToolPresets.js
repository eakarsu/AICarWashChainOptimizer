const json = (value) => JSON.stringify(value, null, 2);

const PRESETS = {
  'price-elasticity': [
    {
      label: 'Downtown baseline',
      values: {
        location_id: 1,
        price_history: [
          { date: '2026-06-01', service: 'Premium Wash', price: 19.99 },
          { date: '2026-07-01', service: 'Premium Wash', price: 21.99 },
          { date: '2026-08-01', service: 'Premium Wash', price: 22.99 },
        ],
        demand_history: [
          { date: '2026-06-01', cars: 148 },
          { date: '2026-07-01', cars: 141 },
          { date: '2026-08-01', cars: 136 },
        ],
      },
    },
    {
      label: 'Weekend peak',
      values: {
        location_id: 2,
        price_history: [
          { date: '2026-07-05', service: 'Deluxe Wash', price: 17.99 },
          { date: '2026-07-12', service: 'Deluxe Wash', price: 18.99 },
          { date: '2026-07-19', service: 'Deluxe Wash', price: 20.49 },
        ],
        demand_history: [
          { date: '2026-07-05', cars: 126 },
          { date: '2026-07-12', cars: 121 },
          { date: '2026-07-19', cars: 113 },
        ],
      },
    },
    {
      label: 'Value-tier review',
      values: {
        location_id: 3,
        price_history: [
          { date: '2026-05-01', service: 'Express Wash', price: 8.99 },
          { date: '2026-06-01', service: 'Express Wash', price: 9.49 },
          { date: '2026-07-01', service: 'Express Wash', price: 9.99 },
        ],
        demand_history: [
          { date: '2026-05-01', cars: 194 },
          { date: '2026-06-01', cars: 188 },
          { date: '2026-07-01', cars: 179 },
        ],
      },
    },
  ],
  'competitor-benchmarking': [
    {
      label: 'Local price review',
      values: {
        competitor_prices: [
          { competitor: 'BlueWave Wash', service: 'Premium', price: 21.99 },
          { competitor: 'QuickShine', service: 'Premium', price: 19.49 },
        ],
        reviews: [
          { competitor: 'BlueWave Wash', rating: 4.2, comment: 'Fast service but inconsistent dryers.' },
          { competitor: 'QuickShine', rating: 3.9, comment: 'Good value; long weekend queue.' },
        ],
        our_data: { service: 'Premium Wash', price: 22.99, rating: 4.6, average_wait_minutes: 8, monthly_members: 1240 },
      },
    },
    {
      label: 'Membership comparison',
      values: {
        competitor_prices: [
          { competitor: 'CleanRide', service: 'Unlimited Basic', price: 27.99 },
          { competitor: 'WashWorks', service: 'Unlimited Premium', price: 45.0 },
        ],
        reviews: [
          { competitor: 'CleanRide', rating: 4.0, comment: 'Simple mobile signup and reliable basic wash.' },
          { competitor: 'WashWorks', rating: 4.4, comment: 'Strong premium value and helpful attendants.' },
        ],
        our_data: { basic_membership_price: 24.99, premium_membership_price: 49.99, retention_rate_pct: 88, locations: 15 },
      },
    },
    {
      label: 'Service differentiation',
      values: {
        competitor_prices: [
          { competitor: 'EcoSplash', service: 'Eco Wash', price: 18.0 },
          { competitor: 'Detail Depot', service: 'Ceramic Safe', price: 32.0 },
        ],
        reviews: [
          { competitor: 'EcoSplash', rating: 4.5, comment: 'Customers value water-saving claims.' },
          { competitor: 'Detail Depot', rating: 4.7, comment: 'Premium vehicle owners praise finish quality.' },
        ],
        our_data: { water_reclaim_pct: 62, ceramic_safe_price: 29.99, nps: 71, differentiator: 'Fast tunnel plus specialty packages' },
      },
    },
  ],
  'employee-burnout': [
    {
      label: 'Normal staffing week',
      values: {
        staff: [
          { id: 101, name: 'Alex Rivera', role: 'Site Manager', location_id: 1 },
          { id: 102, name: 'Jordan Lee', role: 'Wash Technician', location_id: 1 },
        ],
        hours_data: [
          { employee_id: 101, week: '2026-W36', hours: 44, consecutive_days: 5 },
          { employee_id: 102, week: '2026-W36', hours: 38, consecutive_days: 4 },
        ],
        turnover_history: [
          { location_id: 1, quarter: '2026-Q1', departures: 1, average_headcount: 12 },
          { location_id: 1, quarter: '2026-Q2', departures: 0, average_headcount: 13 },
        ],
      },
    },
    {
      label: 'Overtime risk',
      values: {
        staff: [
          { id: 201, name: 'Taylor Morgan', role: 'Equipment Technician', location_id: 2 },
          { id: 202, name: 'Casey Kim', role: 'Wash Technician', location_id: 2 },
        ],
        hours_data: [
          { employee_id: 201, week: '2026-W36', hours: 57, consecutive_days: 8 },
          { employee_id: 202, week: '2026-W36', hours: 51, consecutive_days: 7 },
        ],
        turnover_history: [
          { location_id: 2, quarter: '2026-Q1', departures: 3, average_headcount: 11 },
          { location_id: 2, quarter: '2026-Q2', departures: 2, average_headcount: 10 },
        ],
      },
    },
    {
      label: 'Seasonal ramp',
      values: {
        staff: [
          { id: 301, name: 'Morgan Patel', role: 'Site Manager', location_id: 3 },
          { id: 302, name: 'Riley Chen', role: 'Customer Service', location_id: 3 },
          { id: 303, name: 'Jamie Brooks', role: 'Wash Technician', location_id: 3 },
        ],
        hours_data: [
          { employee_id: 301, week: '2026-W36', hours: 48, consecutive_days: 6 },
          { employee_id: 302, week: '2026-W36', hours: 42, consecutive_days: 5 },
          { employee_id: 303, week: '2026-W36', hours: 46, consecutive_days: 6 },
        ],
        turnover_history: [
          { location_id: 3, quarter: '2025-Q4', departures: 1, average_headcount: 9 },
          { location_id: 3, quarter: '2026-Q1', departures: 2, average_headcount: 10 },
        ],
      },
    },
  ],
  'seasonal-calendar': [
    {
      label: 'Summer demand plan',
      values: {
        historical_data: [
          { month: '2025-06', cars: 3820, revenue: 91680, precipitation_days: 4 },
          { month: '2025-07', cars: 4110, revenue: 101470, precipitation_days: 3 },
          { month: '2025-08', cars: 3960, revenue: 97420, precipitation_days: 5 },
        ],
        upcoming_events: [
          { name: 'Independence Day weekend', date: '2027-07-04', expected_visitors: 24000 },
          { name: 'Back-to-school weekend', date: '2027-08-14', expected_visitors: 12000 },
        ],
      },
    },
    {
      label: 'Winter weather plan',
      values: {
        historical_data: [
          { month: '2025-12', cars: 2440, revenue: 60800, freeze_days: 2 },
          { month: '2026-01', cars: 2180, revenue: 55200, freeze_days: 5 },
          { month: '2026-02', cars: 2710, revenue: 68400, freeze_days: 1 },
        ],
        upcoming_events: [
          { name: 'Holiday travel week', date: '2026-12-20', expected_visitors: 18000 },
          { name: 'New Year return traffic', date: '2027-01-03', expected_visitors: 15000 },
        ],
      },
    },
    {
      label: 'Event surge plan',
      values: {
        historical_data: [
          { event: 'Regional auto show', cars: 980, revenue: 27400, duration_days: 3 },
          { event: 'University homecoming', cars: 760, revenue: 19400, duration_days: 2 },
        ],
        upcoming_events: [
          { name: 'Austin mobility expo', date: '2027-03-12', expected_visitors: 32000 },
          { name: 'University homecoming', date: '2027-10-23', expected_visitors: 28000 },
        ],
      },
    },
  ],
  'expansion-roi': [
    {
      label: 'Suburban growth site',
      values: {
        location_proposal: { address: '2450 Example Parkway, Cedar Park, TX', monthly_rent: 12500, sqft: 4200, bays: 2, buildout_cost: 1450000 },
        demographics: { population_5mi: 84000, median_income: 92000, vehicles_per_household: 2.1, annual_growth_pct: 4.2 },
        competitors: [
          { name: 'QuickShine Cedar', distance_miles: 2.4, basic_price: 11.99, rating: 4.1 },
          { name: 'BlueWave North', distance_miles: 4.8, basic_price: 13.99, rating: 4.4 },
        ],
      },
    },
    {
      label: 'Urban infill site',
      values: {
        location_proposal: { address: '810 Example Avenue, Austin, TX', monthly_rent: 22000, sqft: 3100, bays: 1, buildout_cost: 1820000 },
        demographics: { population_3mi: 112000, median_income: 78000, vehicles_per_household: 1.4, daytime_workers: 64000 },
        competitors: [
          { name: 'Downtown Detail', distance_miles: 1.1, basic_price: 17.99, rating: 4.6 },
          { name: 'Express Auto Spa', distance_miles: 2.0, basic_price: 14.99, rating: 4.0 },
        ],
      },
    },
    {
      label: 'Highway corridor site',
      values: {
        location_proposal: { address: '5600 Example Highway, Round Rock, TX', monthly_rent: 9800, sqft: 5000, bays: 3, buildout_cost: 1675000 },
        demographics: { daily_traffic: 48500, population_5mi: 71000, median_income: 86000, vehicles_per_household: 2.0 },
        competitors: [
          { name: 'RoadRunner Wash', distance_miles: 3.6, basic_price: 10.99, rating: 3.8 },
          { name: 'CleanRide Express', distance_miles: 6.2, basic_price: 12.49, rating: 4.3 },
        ],
      },
    },
  ],
  'water-waste-tracker': [
    {
      label: 'Normal operations',
      values: {
        location_id: 1,
        sensor_data: [
          { ts: '2026-09-01T08:00:00Z', water_gpm: 12.1, chem_ml: 5.2, drain_gpm: 10.8 },
          { ts: '2026-09-01T08:05:00Z', water_gpm: 12.4, chem_ml: 5.1, drain_gpm: 11.0 },
          { ts: '2026-09-01T08:10:00Z', water_gpm: 12.0, chem_ml: 5.3, drain_gpm: 10.7 },
        ],
        time_period_days: 30,
      },
    },
    {
      label: 'Leak investigation',
      values: {
        location_id: 2,
        sensor_data: [
          { ts: '2026-09-02T14:00:00Z', water_gpm: 12.3, chem_ml: 5.0, drain_gpm: 10.9 },
          { ts: '2026-09-02T14:05:00Z', water_gpm: 18.9, chem_ml: 5.2, drain_gpm: 11.1 },
          { ts: '2026-09-02T14:10:00Z', water_gpm: 19.4, chem_ml: 5.1, drain_gpm: 11.2 },
        ],
        time_period_days: 14,
      },
    },
    {
      label: 'Chemical spike review',
      values: {
        location_id: 3,
        sensor_data: [
          { ts: '2026-09-03T17:00:00Z', water_gpm: 11.8, chem_ml: 5.1, drain_gpm: 10.4 },
          { ts: '2026-09-03T17:05:00Z', water_gpm: 12.0, chem_ml: 11.8, drain_gpm: 10.6 },
          { ts: '2026-09-03T17:10:00Z', water_gpm: 11.9, chem_ml: 12.2, drain_gpm: 10.5 },
        ],
        time_period_days: 7,
      },
    },
  ],
  'customer-ltv-segmentation': [
    {
      label: 'Balanced portfolio',
      values: {
        customers: [
          { id: 1001, total_spent: 1860, visits: 48, recency_days: 7, plan: 'Premium', churn_risk: 0.08 },
          { id: 1002, total_spent: 720, visits: 24, recency_days: 21, plan: 'Basic', churn_risk: 0.24 },
          { id: 1003, total_spent: 2840, visits: 65, recency_days: 3, plan: 'Ultimate', churn_risk: 0.04 },
        ],
      },
    },
    {
      label: 'At-risk members',
      values: {
        customers: [
          { id: 2001, total_spent: 940, visits: 31, recency_days: 62, plan: 'Premium', churn_risk: 0.72 },
          { id: 2002, total_spent: 480, visits: 19, recency_days: 48, plan: 'Basic', churn_risk: 0.61 },
          { id: 2003, total_spent: 1320, visits: 37, recency_days: 39, plan: 'Ultimate', churn_risk: 0.55 },
        ],
      },
    },
    {
      label: 'Upsell candidates',
      values: {
        customers: [
          { id: 3001, total_spent: 680, visits: 42, recency_days: 5, plan: 'Basic', churn_risk: 0.09 },
          { id: 3002, total_spent: 810, visits: 47, recency_days: 8, plan: 'Basic', churn_risk: 0.12 },
          { id: 3003, total_spent: 1440, visits: 52, recency_days: 4, plan: 'Premium', churn_risk: 0.06 },
        ],
      },
    },
  ],
  'supply-chain': [
    {
      label: 'Standard replenishment',
      values: {
        usage_history: [
          { date: '2026-08-01', sku: 'CHEM-101', name: 'TriFoam Ultra', units_used: 82 },
          { date: '2026-08-01', sku: 'CHEM-205', name: 'SpotFree Rinse', units_used: 64 },
        ],
        current_inventory: [
          { sku: 'CHEM-101', name: 'TriFoam Ultra', quantity: 38, reorder_point: 25 },
          { sku: 'CHEM-205', name: 'SpotFree Rinse', quantity: 29, reorder_point: 22 },
        ],
        suppliers: [
          { name: 'ChemPro Solutions', skus: ['CHEM-101'], lead_time_days: 5, on_time_pct: 96, bulk_discount_pct: 8 },
          { name: 'WaterTech Supply', skus: ['CHEM-205'], lead_time_days: 4, on_time_pct: 98, bulk_discount_pct: 6 },
        ],
      },
    },
    {
      label: 'Stockout risk',
      values: {
        usage_history: [
          { date: '2026-08-15', sku: 'CHEM-310', name: 'WheelBrite Acid', units_used: 44 },
          { date: '2026-08-22', sku: 'CHEM-310', name: 'WheelBrite Acid', units_used: 51 },
        ],
        current_inventory: [
          { sku: 'CHEM-310', name: 'WheelBrite Acid', quantity: 9, reorder_point: 18 },
          { sku: 'PART-044', name: 'Dryer motor brushes', quantity: 2, reorder_point: 4 },
        ],
        suppliers: [
          { name: 'ChemPro Solutions', skus: ['CHEM-310'], lead_time_days: 9, on_time_pct: 83, expedited_shipping: true },
          { name: 'Tunnel Parts Direct', skus: ['PART-044'], lead_time_days: 12, on_time_pct: 89, expedited_shipping: false },
        ],
      },
    },
    {
      label: 'Bulk-order review',
      values: {
        usage_history: [
          { quarter: '2026-Q1', sku: 'CHEM-420', name: 'FoamCannon Supreme', units_used: 510 },
          { quarter: '2026-Q2', sku: 'CHEM-420', name: 'FoamCannon Supreme', units_used: 568 },
        ],
        current_inventory: [
          { sku: 'CHEM-420', name: 'FoamCannon Supreme', quantity: 126, reorder_point: 80, storage_capacity: 300 },
          { sku: 'CHEM-205', name: 'SpotFree Rinse', quantity: 94, reorder_point: 60, storage_capacity: 240 },
        ],
        suppliers: [
          { name: 'AutoChem Inc', skus: ['CHEM-420'], unit_cost: 25, bulk_unit_cost: 22.5, minimum_bulk_qty: 180, lead_time_days: 6 },
          { name: 'WaterTech Supply', skus: ['CHEM-205'], unit_cost: 22, bulk_unit_cost: 20.25, minimum_bulk_qty: 150, lead_time_days: 4 },
        ],
      },
    },
  ],
};

const isReferenceField = (key) => /(?:^|_)id$/i.test(key);

export function presetsForTool(tool, currentValues = {}) {
  return (PRESETS[tool.key] || []).map((preset) => ({
    label: preset.label,
    values: Object.fromEntries(tool.fields.map((field) => {
      const current = currentValues[field.key];
      const keepCurrentReference = isReferenceField(field.key) && current !== undefined && current !== null && String(current).trim() !== '';
      const value = keepCurrentReference ? current : preset.values[field.key];
      return [field.key, field.type === 'json' && typeof value !== 'string' ? json(value) : String(value ?? '')];
    })),
  }));
}

export function validateToolPresets(tools) {
  return tools.flatMap((tool) => (PRESETS[tool.key] || []).flatMap((preset, presetIndex) => tool.fields.flatMap((field) => {
    const value = preset.values[field.key];
    if (value === undefined || value === null || value === '') return [`${tool.key} preset ${presetIndex + 1} is missing ${field.key}`];
    if (field.type === 'json') {
      try { JSON.parse(json(value)); } catch (_) { return [`${tool.key} preset ${presetIndex + 1} has invalid JSON for ${field.key}`]; }
    }
    return [];
  })));
}
