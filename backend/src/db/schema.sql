-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'manager',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  phone VARCHAR(20),
  capacity INT DEFAULT 50,
  operating_hours VARCHAR(100) DEFAULT '7AM-9PM',
  status VARCHAR(20) DEFAULT 'active',
  monthly_revenue DECIMAL(12,2) DEFAULT 0,
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Memberships
CREATE TABLE IF NOT EXISTS memberships (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  plan_type VARCHAR(50) NOT NULL,
  monthly_price DECIMAL(8,2) NOT NULL,
  location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  washes_this_month INT DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0,
  churn_risk DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  install_date DATE,
  last_maintenance DATE,
  next_maintenance DATE,
  status VARCHAR(20) DEFAULT 'operational',
  health_score DECIMAL(5,2) DEFAULT 100,
  hours_used INT DEFAULT 0,
  purchase_cost DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(100) NOT NULL,
  location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  hourly_rate DECIMAL(8,2) NOT NULL,
  hire_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  hours_per_week INT DEFAULT 40,
  performance_score DECIMAL(5,2) DEFAULT 85,
  certifications TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chemicals
CREATE TABLE IF NOT EXISTS chemicals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  supplier VARCHAR(255),
  unit_cost DECIMAL(8,2) NOT NULL,
  quantity_on_hand DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'gallons',
  reorder_level DECIMAL(10,2) DEFAULT 10,
  optimal_dosage DECIMAL(8,4),
  location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  last_ordered DATE,
  ph_level DECIMAL(4,2),
  safety_rating VARCHAR(20) DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service Packages
CREATE TABLE IF NOT EXISTS service_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(8,2) NOT NULL,
  duration_minutes INT DEFAULT 15,
  wash_type VARCHAR(50) NOT NULL,
  includes_interior BOOLEAN DEFAULT false,
  includes_wax BOOLEAN DEFAULT false,
  includes_tire BOOLEAN DEFAULT false,
  includes_underbody BOOLEAN DEFAULT false,
  popularity_score DECIMAL(5,2) DEFAULT 50,
  profit_margin DECIMAL(5,2) DEFAULT 40,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  vehicle_type VARCHAR(100),
  vehicle_plate VARCHAR(20),
  preferred_location INT REFERENCES locations(id) ON DELETE SET NULL,
  total_visits INT DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit DATE,
  satisfaction_score DECIMAL(5,2) DEFAULT 0,
  membership_id INT REFERENCES memberships(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weather Forecasts
CREATE TABLE IF NOT EXISTS weather_forecasts (
  id SERIAL PRIMARY KEY,
  location_id INT REFERENCES locations(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  condition VARCHAR(50) NOT NULL,
  temp_high DECIMAL(5,1),
  temp_low DECIMAL(5,1),
  precipitation_chance DECIMAL(5,2) DEFAULT 0,
  humidity DECIMAL(5,2) DEFAULT 0,
  predicted_demand VARCHAR(20) DEFAULT 'medium',
  predicted_cars INT DEFAULT 0,
  ai_recommendation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chemical Dosing Logs
CREATE TABLE IF NOT EXISTS chemical_dosing (
  id SERIAL PRIMARY KEY,
  chemical_id INT REFERENCES chemicals(id) ON DELETE CASCADE,
  location_id INT REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  water_hardness DECIMAL(6,2),
  temperature DECIMAL(5,1),
  vehicle_soil_level VARCHAR(20) DEFAULT 'medium',
  recommended_dosage DECIMAL(8,4),
  actual_dosage DECIMAL(8,4),
  effectiveness_score DECIMAL(5,2),
  ai_optimization TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance Predictions
CREATE TABLE IF NOT EXISTS maintenance_predictions (
  id SERIAL PRIMARY KEY,
  equipment_id INT REFERENCES equipment(id) ON DELETE CASCADE,
  predicted_failure_date DATE,
  confidence DECIMAL(5,2),
  risk_level VARCHAR(20) DEFAULT 'low',
  recommended_action TEXT,
  estimated_cost DECIMAL(10,2),
  parts_needed TEXT,
  ai_analysis TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Staffing Schedules
CREATE TABLE IF NOT EXISTS staffing_schedules (
  id SERIAL PRIMARY KEY,
  location_id INT REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  shift VARCHAR(20) NOT NULL,
  required_staff INT DEFAULT 3,
  predicted_demand VARCHAR(20) DEFAULT 'medium',
  weather_factor DECIMAL(5,2) DEFAULT 1.0,
  employee_ids TEXT,
  labor_cost DECIMAL(10,2),
  ai_recommendation TEXT,
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Revenue Analytics
CREATE TABLE IF NOT EXISTS revenue_analytics (
  id SERIAL PRIMARY KEY,
  location_id INT REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_cars INT DEFAULT 0,
  avg_ticket DECIMAL(8,2) DEFAULT 0,
  membership_revenue DECIMAL(12,2) DEFAULT 0,
  walk_in_revenue DECIMAL(12,2) DEFAULT 0,
  top_service VARCHAR(100),
  ai_insights TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Feedback
CREATE TABLE IF NOT EXISTS customer_feedback (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  location_id INT REFERENCES locations(id) ON DELETE SET NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  service_date DATE,
  service_type VARCHAR(100),
  sentiment VARCHAR(20),
  sentiment_score DECIMAL(5,2),
  ai_analysis TEXT,
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Energy Usage
CREATE TABLE IF NOT EXISTS energy_usage (
  id SERIAL PRIMARY KEY,
  location_id INT REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  electricity_kwh DECIMAL(10,2) DEFAULT 0,
  water_gallons DECIMAL(10,2) DEFAULT 0,
  gas_therms DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  cars_washed INT DEFAULT 0,
  cost_per_car DECIMAL(8,2) DEFAULT 0,
  ai_optimization TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
