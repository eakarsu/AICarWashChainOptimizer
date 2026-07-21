const pool = require('./connection');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function seed() {
  if (process.env.CONFIRM_DEMO_SEED !== 'yes' || process.env.NODE_ENV === 'production') throw new Error('Demo seed requires CONFIRM_DEMO_SEED=yes outside production');
  if (!process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < 12) throw new Error('DEMO_PASSWORD must contain at least 12 characters');
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema created successfully');

    // Seed Users
    const hashedPassword = await bcrypt.hash(process.env.DEMO_PASSWORD, 10);
    await client.query(`DELETE FROM users`);
    await client.query(`INSERT INTO users (email, password, name, role) VALUES
      ('admin@carwash.com', $1, 'Admin User', 'admin'),
      ('manager@carwash.com', $1, 'John Manager', 'manager')
    `, [hashedPassword]);
    console.log('Users seeded');

    // Seed Locations (15 items)
    await client.query(`DELETE FROM energy_usage`);
    await client.query(`DELETE FROM revenue_analytics`);
    await client.query(`DELETE FROM staffing_schedules`);
    await client.query(`DELETE FROM maintenance_predictions`);
    await client.query(`DELETE FROM chemical_dosing`);
    await client.query(`DELETE FROM weather_forecasts`);
    await client.query(`DELETE FROM customer_feedback`);
    await client.query(`DELETE FROM customers`);
    await client.query(`DELETE FROM memberships`);
    await client.query(`DELETE FROM equipment`);
    await client.query(`DELETE FROM employees`);
    await client.query(`DELETE FROM chemicals`);
    await client.query(`DELETE FROM service_packages`);
    await client.query(`DELETE FROM locations`);

    await client.query(`INSERT INTO locations (name, address, city, state, zip, phone, capacity, operating_hours, status, monthly_revenue, lat, lng) VALUES
      ('SparkleWash Downtown', '123 Main St', 'Austin', 'TX', '73301', '512-555-0101', 60, '6AM-10PM', 'active', 85000.00, 30.2672, -97.7431),
      ('SparkleWash Northside', '456 Oak Ave', 'Austin', 'TX', '73301', '512-555-0102', 45, '7AM-9PM', 'active', 62000.00, 30.3500, -97.7200),
      ('SparkleWash Lakeline', '789 Lake Blvd', 'Cedar Park', 'TX', '78613', '512-555-0103', 55, '6AM-10PM', 'active', 78000.00, 30.5083, -97.8200),
      ('SparkleWash South Congress', '321 S Congress Ave', 'Austin', 'TX', '73301', '512-555-0104', 40, '7AM-9PM', 'active', 71000.00, 30.2400, -97.7500),
      ('SparkleWash Round Rock', '654 IH-35', 'Round Rock', 'TX', '78664', '512-555-0105', 50, '6AM-9PM', 'active', 58000.00, 30.5083, -97.6789),
      ('SparkleWash Pflugerville', '987 Pecan St', 'Pflugerville', 'TX', '78660', '512-555-0106', 35, '7AM-8PM', 'active', 45000.00, 30.4394, -97.6200),
      ('SparkleWash Bee Cave', '147 Bee Cave Rd', 'Bee Cave', 'TX', '78738', '512-555-0107', 40, '7AM-9PM', 'active', 67000.00, 30.3083, -97.9400),
      ('SparkleWash Georgetown', '258 University Ave', 'Georgetown', 'TX', '78626', '512-555-0108', 45, '6AM-9PM', 'active', 52000.00, 30.6333, -97.6778),
      ('SparkleWash Dripping Springs', '369 Hwy 290', 'Dripping Springs', 'TX', '78620', '512-555-0109', 30, '7AM-8PM', 'active', 38000.00, 30.1902, -98.0867),
      ('SparkleWash Kyle', '741 Center St', 'Kyle', 'TX', '78640', '512-555-0110', 35, '7AM-9PM', 'active', 41000.00, 29.9889, -97.8772),
      ('SparkleWash San Marcos', '852 Hopkins St', 'San Marcos', 'TX', '78666', '512-555-0111', 40, '6AM-10PM', 'active', 49000.00, 29.8833, -97.9414),
      ('SparkleWash Buda', '963 Main St', 'Buda', 'TX', '78610', '512-555-0112', 30, '7AM-8PM', 'active', 35000.00, 30.0852, -97.8403),
      ('SparkleWash Leander', '159 Crystal Falls', 'Leander', 'TX', '78641', '512-555-0113', 45, '6AM-9PM', 'active', 55000.00, 30.5788, -97.8531),
      ('SparkleWash Manor', '267 Parsons St', 'Manor', 'TX', '78653', '512-555-0114', 25, '7AM-8PM', 'maintenance', 28000.00, 30.3408, -97.5567),
      ('SparkleWash Hutto', '378 East St', 'Hutto', 'TX', '78634', '512-555-0115', 30, '7AM-8PM', 'active', 32000.00, 30.5427, -97.5467)
    `);
    console.log('Locations seeded');

    // Seed Memberships (15 items)
    await client.query(`INSERT INTO memberships (customer_name, email, phone, plan_type, monthly_price, location_id, start_date, renewal_date, status, washes_this_month, lifetime_value, churn_risk) VALUES
      ('Alice Johnson', 'alice@email.com', '512-555-1001', 'Premium', 49.99, 1, '2024-01-15', '2026-04-15', 'active', 6, 599.88, 5.2),
      ('Bob Smith', 'bob@email.com', '512-555-1002', 'Basic', 24.99, 1, '2024-03-01', '2026-04-01', 'active', 3, 449.82, 12.8),
      ('Carol Davis', 'carol@email.com', '512-555-1003', 'Ultimate', 69.99, 2, '2024-02-10', '2026-04-10', 'active', 8, 839.88, 3.1),
      ('David Wilson', 'david@email.com', '512-555-1004', 'Premium', 49.99, 2, '2024-06-01', '2026-04-01', 'active', 4, 449.91, 18.5),
      ('Emma Brown', 'emma@email.com', '512-555-1005', 'Basic', 24.99, 3, '2024-05-15', '2026-04-15', 'active', 2, 249.90, 35.7),
      ('Frank Garcia', 'frank@email.com', '512-555-1006', 'Ultimate', 69.99, 3, '2024-01-01', '2026-04-01', 'active', 10, 1049.85, 2.0),
      ('Grace Lee', 'grace@email.com', '512-555-1007', 'Premium', 49.99, 4, '2024-04-20', '2026-04-20', 'active', 5, 549.89, 8.9),
      ('Henry Martinez', 'henry@email.com', '512-555-1008', 'Basic', 24.99, 5, '2024-07-01', '2026-04-01', 'active', 1, 199.92, 42.3),
      ('Iris Thompson', 'iris@email.com', '512-555-1009', 'Premium', 49.99, 5, '2024-08-15', '2026-04-15', 'active', 7, 399.92, 6.4),
      ('Jack Anderson', 'jack@email.com', '512-555-1010', 'Ultimate', 69.99, 6, '2024-03-10', '2026-04-10', 'active', 9, 909.87, 4.5),
      ('Karen White', 'karen@email.com', '512-555-1011', 'Basic', 24.99, 7, '2024-09-01', '2026-04-01', 'expired', 0, 149.94, 85.0),
      ('Leo Harris', 'leo@email.com', '512-555-1012', 'Premium', 49.99, 8, '2024-02-28', '2026-04-28', 'active', 4, 649.87, 11.2),
      ('Mia Clark', 'mia@email.com', '512-555-1013', 'Ultimate', 69.99, 9, '2024-06-15', '2026-04-15', 'active', 6, 629.91, 7.8),
      ('Nathan Lewis', 'nathan@email.com', '512-555-1014', 'Basic', 24.99, 10, '2024-10-01', '2026-04-01', 'paused', 0, 124.95, 65.0),
      ('Olivia Walker', 'olivia@email.com', '512-555-1015', 'Premium', 49.99, 11, '2024-04-01', '2026-04-01', 'active', 5, 549.89, 9.3)
    `);
    console.log('Memberships seeded');

    // Seed Equipment (15 items)
    await client.query(`INSERT INTO equipment (name, type, location_id, manufacturer, model, install_date, last_maintenance, next_maintenance, status, health_score, hours_used, purchase_cost) VALUES
      ('Tunnel Conveyor A', 'Conveyor System', 1, 'MacNeil', 'MC-4000', '2022-01-15', '2026-02-01', '2026-05-01', 'operational', 92.5, 12500, 85000.00),
      ('High Pressure Arch 1', 'Pressure Washer', 1, 'WashTec', 'SoftCare Pro', '2022-03-10', '2026-01-15', '2026-04-15', 'operational', 88.0, 11000, 45000.00),
      ('Foam Applicator B', 'Chemical Dispenser', 2, 'Sonny''s', 'FoamMaster 200', '2023-06-01', '2026-02-20', '2026-05-20', 'operational', 95.0, 5500, 22000.00),
      ('Dryer System C', 'Air Dryer', 2, 'Proto-Vest', 'Hurricane 360', '2021-11-20', '2026-01-10', '2026-04-10', 'needs_maintenance', 72.3, 15000, 38000.00),
      ('Wheel Cleaner X', 'Wheel Washer', 3, 'Belanger', 'SpinBrite', '2023-02-14', '2026-03-01', '2026-06-01', 'operational', 90.0, 8000, 28000.00),
      ('Water Reclaim Unit', 'Water System', 3, 'Hydro-Spray', 'RecoverMax', '2022-07-01', '2025-12-15', '2026-03-15', 'operational', 85.5, 9500, 55000.00),
      ('Tunnel Conveyor B', 'Conveyor System', 4, 'MacNeil', 'MC-3000', '2020-05-10', '2026-02-28', '2026-05-28', 'operational', 78.2, 18000, 72000.00),
      ('Wax Applicator', 'Chemical Dispenser', 5, 'Sonny''s', 'WaxPro 100', '2023-09-15', '2026-03-10', '2026-06-10', 'operational', 97.0, 3000, 18000.00),
      ('Undercarriage Washer', 'Pressure Washer', 5, 'WashTec', 'UnderBlast', '2022-12-01', '2026-01-20', '2026-04-20', 'operational', 83.0, 10500, 32000.00),
      ('Soft Touch Brush A', 'Brush System', 6, 'Belanger', 'VelvetTouch', '2023-01-20', '2026-02-15', '2026-05-15', 'needs_maintenance', 68.5, 7500, 25000.00),
      ('Payment Kiosk 1', 'POS System', 7, 'DRB Systems', 'SiteWatch', '2023-04-01', '2026-03-01', '2026-09-01', 'operational', 99.0, 4000, 15000.00),
      ('Water Heater Unit', 'Water System', 8, 'Aaladin', 'HeatWave 500', '2021-08-15', '2025-11-30', '2026-02-28', 'critical', 55.0, 20000, 42000.00),
      ('Vacuum Station Bank', 'Vacuum System', 9, 'JE Adams', 'SuperVac 8', '2022-10-01', '2026-02-10', '2026-05-10', 'operational', 82.0, 13000, 35000.00),
      ('LED Sign Display', 'Signage', 10, 'Daktronics', 'LED-Pro 200', '2023-07-15', '2026-01-05', '2026-07-05', 'operational', 94.0, 6000, 12000.00),
      ('Chemical Mixing Unit', 'Chemical Dispenser', 11, 'Hydro-Spray', 'MixMaster Pro', '2022-04-20', '2026-03-05', '2026-06-05', 'operational', 86.0, 11500, 28000.00)
    `);
    console.log('Equipment seeded');

    // Seed Employees (15 items)
    await client.query(`INSERT INTO employees (name, email, phone, role, location_id, hourly_rate, hire_date, status, hours_per_week, performance_score, certifications) VALUES
      ('Mike Rodriguez', 'mike.r@carwash.com', '512-555-2001', 'Site Manager', 1, 28.00, '2022-01-10', 'active', 45, 94.5, 'Management, Safety Lead'),
      ('Sarah Chen', 'sarah.c@carwash.com', '512-555-2002', 'Wash Technician', 1, 18.50, '2023-03-15', 'active', 40, 88.0, 'Chemical Handling'),
      ('James Williams', 'james.w@carwash.com', '512-555-2003', 'Wash Technician', 1, 17.00, '2023-08-01', 'active', 35, 82.5, NULL),
      ('Linda Martinez', 'linda.m@carwash.com', '512-555-2004', 'Site Manager', 2, 27.00, '2022-04-20', 'active', 45, 91.0, 'Management, Equipment Maintenance'),
      ('Robert Taylor', 'robert.t@carwash.com', '512-555-2005', 'Equipment Technician', 2, 24.00, '2022-06-15', 'active', 40, 93.0, 'Equipment Cert, Electrical'),
      ('Jennifer Lopez', 'jennifer.l@carwash.com', '512-555-2006', 'Wash Technician', 3, 17.50, '2023-05-01', 'active', 38, 85.0, 'Chemical Handling'),
      ('William Brown', 'william.b@carwash.com', '512-555-2007', 'Site Manager', 3, 26.50, '2022-08-10', 'active', 45, 89.5, 'Management'),
      ('Patricia Davis', 'patricia.d@carwash.com', '512-555-2008', 'Customer Service', 4, 16.00, '2024-01-15', 'active', 30, 90.0, NULL),
      ('Christopher Wilson', 'chris.w@carwash.com', '512-555-2009', 'Equipment Technician', 4, 23.00, '2023-02-28', 'active', 40, 87.5, 'Equipment Cert'),
      ('Amanda Moore', 'amanda.m@carwash.com', '512-555-2010', 'Wash Technician', 5, 17.00, '2023-09-01', 'active', 36, 79.0, NULL),
      ('Daniel Garcia', 'daniel.g@carwash.com', '512-555-2011', 'Site Manager', 5, 27.50, '2022-03-01', 'active', 45, 92.0, 'Management, Safety Lead'),
      ('Michelle Thomas', 'michelle.t@carwash.com', '512-555-2012', 'Customer Service', 6, 16.50, '2024-02-01', 'active', 25, 86.0, NULL),
      ('Kevin Anderson', 'kevin.a@carwash.com', '512-555-2013', 'Wash Technician', 7, 18.00, '2023-06-15', 'active', 40, 84.0, 'Chemical Handling'),
      ('Jessica White', 'jessica.w@carwash.com', '512-555-2014', 'Equipment Technician', 8, 22.50, '2023-01-10', 'active', 40, 95.0, 'Equipment Cert, Electrical, Plumbing'),
      ('Brian Harris', 'brian.h@carwash.com', '512-555-2015', 'Wash Technician', 9, 16.50, '2024-03-01', 'active', 32, 76.0, NULL)
    `);
    console.log('Employees seeded');

    // Seed Chemicals (15 items)
    await client.query(`INSERT INTO chemicals (name, type, supplier, unit_cost, quantity_on_hand, unit, reorder_level, optimal_dosage, location_id, last_ordered, ph_level, safety_rating) VALUES
      ('TriFoam Ultra', 'Pre-soak', 'ChemPro Solutions', 32.50, 120.0, 'gallons', 25.0, 2.5000, 1, '2026-03-01', 9.5, 'standard'),
      ('BrightShine Polish', 'Polish/Wax', 'AutoChem Inc', 45.00, 85.0, 'gallons', 20.0, 1.2000, 1, '2026-02-15', 7.0, 'standard'),
      ('PowerClean Degreaser', 'Degreaser', 'ChemPro Solutions', 38.00, 65.0, 'gallons', 15.0, 3.0000, 2, '2026-02-20', 12.5, 'caution'),
      ('AquaSoft Rinse Aid', 'Rinse Aid', 'WaterTech Supply', 28.00, 150.0, 'gallons', 30.0, 0.8000, 2, '2026-03-05', 6.8, 'standard'),
      ('TireBlack Pro', 'Tire Cleaner', 'AutoChem Inc', 42.00, 45.0, 'gallons', 10.0, 1.5000, 3, '2026-01-25', 3.5, 'caution'),
      ('BugBuster Enzyme', 'Bug Remover', 'BioClean Corp', 55.00, 30.0, 'gallons', 8.0, 0.5000, 3, '2026-02-10', 8.0, 'standard'),
      ('ClearCoat Sealant', 'Sealant', 'ProFinish Ltd', 68.00, 40.0, 'gallons', 10.0, 0.3000, 4, '2026-03-10', 7.2, 'standard'),
      ('WheelBrite Acid', 'Wheel Cleaner', 'ChemPro Solutions', 48.00, 55.0, 'gallons', 12.0, 2.0000, 5, '2026-02-28', 2.0, 'hazardous'),
      ('FoamCannon Supreme', 'Foam Soap', 'AutoChem Inc', 25.00, 200.0, 'gallons', 40.0, 4.0000, 5, '2026-03-08', 7.5, 'standard'),
      ('SpotFree Final Rinse', 'Rinse', 'WaterTech Supply', 22.00, 175.0, 'gallons', 35.0, 1.0000, 6, '2026-03-12', 7.0, 'standard'),
      ('UnderGuard Protectant', 'Undercarriage', 'ProFinish Ltd', 52.00, 60.0, 'gallons', 15.0, 2.8000, 7, '2026-02-05', 8.5, 'standard'),
      ('GreenClean Eco Soap', 'All-Purpose', 'BioClean Corp', 35.00, 90.0, 'gallons', 20.0, 3.5000, 8, '2026-03-01', 7.8, 'eco-safe'),
      ('RustBan Treatment', 'Rust Inhibitor', 'ChemPro Solutions', 62.00, 25.0, 'gallons', 8.0, 0.4000, 9, '2026-01-30', 6.0, 'caution'),
      ('AromaFresh Scent', 'Fragrance', 'ScentWorks', 18.00, 35.0, 'gallons', 8.0, 0.2000, 10, '2026-03-15', 7.0, 'standard'),
      ('HydroWax Premium', 'Wax', 'ProFinish Ltd', 75.00, 50.0, 'gallons', 12.0, 0.6000, 11, '2026-02-18', 7.3, 'standard')
    `);
    console.log('Chemicals seeded');

    // Seed Service Packages (15 items)
    await client.query(`INSERT INTO service_packages (name, description, price, duration_minutes, wash_type, includes_interior, includes_wax, includes_tire, includes_underbody, popularity_score, profit_margin, status) VALUES
      ('Express Wash', 'Quick exterior wash with spot-free rinse', 8.99, 5, 'express', false, false, false, false, 85.0, 55.0, 'active'),
      ('Basic Clean', 'Exterior wash with triple foam polish', 12.99, 8, 'basic', false, false, false, false, 72.0, 50.0, 'active'),
      ('Deluxe Wash', 'Full exterior with wax and tire shine', 18.99, 12, 'deluxe', false, true, true, false, 68.0, 48.0, 'active'),
      ('Premium Wash', 'Complete exterior with underbody flush', 24.99, 15, 'premium', false, true, true, true, 55.0, 45.0, 'active'),
      ('Ultimate Clean', 'Full service with interior vacuum', 34.99, 25, 'ultimate', true, true, true, true, 42.0, 42.0, 'active'),
      ('VIP Detail', 'Hand wash with full detail service', 59.99, 60, 'detail', true, true, true, true, 18.0, 38.0, 'active'),
      ('Monthly Basic', 'Unlimited basic washes per month', 24.99, 8, 'membership', false, false, false, false, 30.0, 60.0, 'active'),
      ('Monthly Premium', 'Unlimited premium washes per month', 49.99, 15, 'membership', false, true, true, true, 35.0, 55.0, 'active'),
      ('Monthly Ultimate', 'Unlimited ultimate washes per month', 69.99, 25, 'membership', true, true, true, true, 25.0, 50.0, 'active'),
      ('Fleet Basic', 'Fleet pricing - basic wash', 6.99, 5, 'fleet', false, false, false, false, 15.0, 35.0, 'active'),
      ('Fleet Premium', 'Fleet pricing - premium wash', 16.99, 12, 'fleet', false, true, true, false, 12.0, 32.0, 'active'),
      ('Ceramic Coating Wash', 'Safe wash for ceramic coated vehicles', 29.99, 20, 'specialty', false, false, true, true, 8.0, 52.0, 'active'),
      ('Bug & Tar Removal', 'Specialized cleaning for heavy soil', 19.99, 15, 'specialty', false, false, false, false, 10.0, 45.0, 'active'),
      ('Winter Protection', 'Salt removal with rust inhibitor', 22.99, 15, 'seasonal', false, false, false, true, 20.0, 47.0, 'active'),
      ('Summer Shield', 'UV protectant with premium wax', 27.99, 18, 'seasonal', false, true, true, false, 22.0, 44.0, 'active')
    `);
    console.log('Service Packages seeded');

    // Seed Customers (15 items)
    await client.query(`INSERT INTO customers (name, email, phone, vehicle_type, vehicle_plate, preferred_location, total_visits, total_spent, last_visit, satisfaction_score, notes) VALUES
      ('Tom Parker', 'tom.p@email.com', '512-555-3001', 'Tesla Model 3', 'TX-ABC123', 1, 45, 892.50, '2026-03-18', 4.8, 'Prefers touchless wash'),
      ('Susan Clark', 'susan.c@email.com', '512-555-3002', 'Toyota Camry', 'TX-DEF456', 1, 32, 545.00, '2026-03-15', 4.5, NULL),
      ('Paul Adams', 'paul.a@email.com', '512-555-3003', 'Ford F-150', 'TX-GHI789', 2, 28, 685.00, '2026-03-17', 4.2, 'Large truck - needs extra time'),
      ('Nancy Wright', 'nancy.w@email.com', '512-555-3004', 'Honda CR-V', 'TX-JKL012', 2, 52, 1024.00, '2026-03-19', 4.9, 'VIP customer'),
      ('George Hill', 'george.h@email.com', '512-555-3005', 'BMW X5', 'TX-MNO345', 3, 18, 540.00, '2026-03-10', 3.8, 'Complained about water spots'),
      ('Betty King', 'betty.k@email.com', '512-555-3006', 'Chevrolet Equinox', 'TX-PQR678', 3, 40, 720.00, '2026-03-16', 4.6, NULL),
      ('Edward Scott', 'edward.s@email.com', '512-555-3007', 'Mercedes C300', 'TX-STU901', 4, 22, 878.00, '2026-03-12', 4.4, 'Only uses premium service'),
      ('Dorothy Green', 'dorothy.g@email.com', '512-555-3008', 'Subaru Outback', 'TX-VWX234', 5, 35, 595.00, '2026-03-14', 4.7, NULL),
      ('Frank Baker', 'frank.b@email.com', '512-555-3009', 'Ram 1500', 'TX-YZA567', 5, 15, 375.00, '2026-03-08', 3.5, 'Infrequent visitor'),
      ('Margaret Hall', 'margaret.h@email.com', '512-555-3010', 'Lexus RX350', 'TX-BCD890', 6, 48, 1440.00, '2026-03-19', 5.0, 'Top customer - always tips'),
      ('Steven Allen', 'steven.a@email.com', '512-555-3011', 'Jeep Wrangler', 'TX-EFG123', 7, 12, 215.00, '2026-03-05', 3.9, 'Muddy vehicle frequently'),
      ('Lisa Young', 'lisa.y@email.com', '512-555-3012', 'Audi Q5', 'TX-HIJ456', 8, 25, 625.00, '2026-03-11', 4.3, NULL),
      ('Richard Hernandez', 'richard.h@email.com', '512-555-3013', 'Nissan Altima', 'TX-KLM789', 9, 60, 780.00, '2026-03-20', 4.1, 'Express wash only'),
      ('Barbara Nelson', 'barbara.n@email.com', '512-555-3014', 'Hyundai Tucson', 'TX-NOP012', 10, 20, 360.00, '2026-03-13', 4.0, NULL),
      ('Charles Robinson', 'charles.r@email.com', '512-555-3015', 'Porsche Cayenne', 'TX-QRS345', 11, 30, 1200.00, '2026-03-17', 4.8, 'VIP - ceramic coating customer')
    `);
    console.log('Customers seeded');

    // Seed Weather Forecasts (15 items)
    await client.query(`INSERT INTO weather_forecasts (location_id, forecast_date, condition, temp_high, temp_low, precipitation_chance, humidity, predicted_demand, predicted_cars, ai_recommendation) VALUES
      (1, '2026-03-20', 'Sunny', 82, 58, 0, 35, 'high', 120, 'Perfect wash day - staff up and prepare for high volume'),
      (1, '2026-03-21', 'Partly Cloudy', 78, 55, 10, 40, 'high', 105, 'Good conditions expected - maintain full staffing'),
      (1, '2026-03-22', 'Rainy', 65, 50, 80, 75, 'low', 35, 'Heavy rain expected - reduce staff, focus on interior services'),
      (2, '2026-03-20', 'Sunny', 83, 59, 0, 33, 'high', 95, 'High demand expected - ensure chemical supplies are stocked'),
      (2, '2026-03-21', 'Thunderstorm', 72, 55, 90, 80, 'very_low', 15, 'Severe weather warning - consider early closure'),
      (3, '2026-03-20', 'Sunny', 81, 57, 5, 38, 'high', 110, 'Great conditions - promote premium packages'),
      (3, '2026-03-21', 'Overcast', 70, 52, 30, 55, 'medium', 65, 'Moderate demand - standard staffing sufficient'),
      (4, '2026-03-20', 'Sunny', 84, 60, 0, 30, 'high', 85, 'Peak conditions - activate all wash bays'),
      (5, '2026-03-20', 'Windy', 76, 54, 15, 42, 'medium', 70, 'Wind may deter some customers - focus on express washes'),
      (6, '2026-03-20', 'Sunny', 80, 56, 0, 36, 'high', 60, 'Small location - cap at capacity, manage queues'),
      (7, '2026-03-20', 'Partly Cloudy', 79, 57, 20, 45, 'medium', 70, 'Moderate outlook - standard operations'),
      (8, '2026-03-20', 'Sunny', 82, 58, 0, 34, 'high', 90, 'Excellent conditions - push membership sign-ups'),
      (9, '2026-03-21', 'Drizzle', 68, 52, 60, 70, 'low', 25, 'Light rain likely - offer rain-check promotions'),
      (10, '2026-03-20', 'Sunny', 83, 59, 0, 32, 'high', 55, 'Good day for business - ensure equipment is ready'),
      (11, '2026-03-20', 'Hot', 95, 72, 0, 25, 'medium', 65, 'Extreme heat - check water supply and equipment cooling')
    `);
    console.log('Weather Forecasts seeded');

    // Seed Chemical Dosing (15 items)
    await client.query(`INSERT INTO chemical_dosing (chemical_id, location_id, date, water_hardness, temperature, vehicle_soil_level, recommended_dosage, actual_dosage, effectiveness_score, ai_optimization) VALUES
      (1, 1, '2026-03-20', 180.5, 72, 'heavy', 3.2000, 3.0000, 88.5, 'Increase pre-soak by 0.2oz for heavy soil in hard water conditions'),
      (2, 1, '2026-03-20', 180.5, 72, 'medium', 1.0000, 1.2000, 92.0, 'Current dosage optimal - slight reduction possible'),
      (3, 2, '2026-03-20', 155.0, 68, 'heavy', 3.5000, 3.5000, 90.0, 'Degreaser at optimal level for current conditions'),
      (4, 2, '2026-03-20', 155.0, 68, 'light', 0.6000, 0.8000, 95.0, 'Rinse aid can be reduced for light soil vehicles'),
      (5, 3, '2026-03-20', 200.0, 75, 'medium', 1.8000, 1.5000, 85.0, 'Increase tire cleaner for hard water area'),
      (9, 5, '2026-03-20', 170.0, 70, 'medium', 3.8000, 4.0000, 91.0, 'Foam soap dosage slightly high - reduce by 5%'),
      (6, 3, '2026-03-19', 195.0, 73, 'heavy', 0.7000, 0.5000, 78.0, 'Bug remover needs increase during spring season'),
      (7, 4, '2026-03-20', 165.0, 71, 'light', 0.2500, 0.3000, 94.0, 'Sealant application is efficient at current rate'),
      (8, 5, '2026-03-19', 170.0, 69, 'heavy', 2.5000, 2.0000, 82.0, 'Wheel cleaner needs boost for brake dust season'),
      (10, 6, '2026-03-20', 185.0, 74, 'medium', 0.9000, 1.0000, 93.0, 'Final rinse performing well - maintain current level'),
      (11, 7, '2026-03-20', 175.0, 70, 'medium', 2.5000, 2.8000, 89.0, 'Undercarriage protectant slightly over-applied'),
      (12, 8, '2026-03-20', 160.0, 68, 'light', 3.0000, 3.5000, 87.0, 'Eco soap over-dosed for light soil - reduce 15%'),
      (13, 9, '2026-03-19', 210.0, 65, 'medium', 0.5000, 0.4000, 80.0, 'Rust inhibitor needs increase for high-hardness water'),
      (14, 10, '2026-03-20', 145.0, 72, 'light', 0.2000, 0.2000, 98.0, 'Fragrance dosage perfect'),
      (15, 11, '2026-03-20', 190.0, 71, 'heavy', 0.8000, 0.6000, 83.0, 'Increase wax application for hard water protection')
    `);
    console.log('Chemical Dosing seeded');

    // Seed Maintenance Predictions (15 items)
    await client.query(`INSERT INTO maintenance_predictions (equipment_id, predicted_failure_date, confidence, risk_level, recommended_action, estimated_cost, parts_needed, ai_analysis, status) VALUES
      (1, '2026-05-15', 78.5, 'medium', 'Replace conveyor belt bearings', 2500.00, 'Belt bearings x4, lubricant', 'Vibration pattern indicates bearing wear. Schedule replacement within 60 days to avoid breakdown.', 'pending'),
      (4, '2026-04-01', 92.0, 'high', 'Replace dryer motor brushes', 1800.00, 'Motor brushes x2, capacitor', 'Motor drawing excessive current. Imminent failure likely within 2 weeks if not addressed.', 'urgent'),
      (7, '2026-06-10', 65.0, 'medium', 'Inspect and lubricate chain drive', 800.00, 'Chain lubricant, tension springs', 'Chain elongation detected. Preventive maintenance recommended before summer rush.', 'pending'),
      (10, '2026-03-28', 95.0, 'critical', 'Replace brush cloth strips', 3200.00, 'Cloth strips x12, mounting hardware', 'Brush material worn beyond threshold. Customer complaints about scratching possible.', 'urgent'),
      (12, '2026-04-15', 88.0, 'high', 'Replace heating element and thermostat', 4500.00, 'Heating element, thermostat, gaskets', 'Water temperature fluctuations detected. Element degradation confirmed by sensor data.', 'pending'),
      (2, '2026-07-01', 55.0, 'low', 'Inspect nozzle alignment', 350.00, 'Nozzle tips x6', 'Minor pressure variation detected. Schedule inspection during next maintenance window.', 'scheduled'),
      (6, '2026-05-20', 72.0, 'medium', 'Replace filtration membranes', 6000.00, 'RO membranes x3, O-rings', 'Water quality output declining. Membrane replacement needed within 90 days.', 'pending'),
      (9, '2026-04-30', 80.0, 'medium', 'Replace undercarriage spray nozzles', 450.00, 'Spray nozzles x8, fittings', 'Spray pattern degraded. Nozzle erosion from road debris.', 'pending'),
      (3, '2026-08-01', 45.0, 'low', 'Check foam pump seals', 200.00, 'Pump seal kit', 'Slight foam output variation. Monitor for next 30 days.', 'monitoring'),
      (5, '2026-06-15', 60.0, 'low', 'Inspect wheel cleaner spindles', 550.00, 'Spindle bearings x4', 'Minor vibration increase noted. Not yet critical.', 'monitoring'),
      (8, '2026-09-01', 40.0, 'low', 'Scheduled wax pump maintenance', 300.00, 'Pump diaphragm, valves', 'Normal wear pattern. Schedule routine maintenance.', 'scheduled'),
      (11, '2026-12-01', 30.0, 'low', 'Software update and calibration', 150.00, 'None', 'POS system running smoothly. Annual update due.', 'scheduled'),
      (13, '2026-05-01', 70.0, 'medium', 'Replace vacuum motors', 2800.00, 'Vacuum motors x3, filters', 'Suction power declining on 3 units. Motor brushes wearing.', 'pending'),
      (14, '2026-10-01', 35.0, 'low', 'LED panel inspection', 250.00, 'LED modules x2', 'Minor pixel issues detected. Cosmetic concern only.', 'monitoring'),
      (15, '2026-04-20', 75.0, 'medium', 'Calibrate chemical mixing ratios', 400.00, 'Metering valves x2, calibration kit', 'Mixing ratios drifting from spec. Recalibration needed.', 'pending')
    `);
    console.log('Maintenance Predictions seeded');

    // Seed Staffing Schedules (15 items)
    await client.query(`INSERT INTO staffing_schedules (location_id, date, shift, required_staff, predicted_demand, weather_factor, employee_ids, labor_cost, ai_recommendation, status) VALUES
      (1, '2026-03-20', 'morning', 5, 'high', 1.2, '1,2,3', 680.00, 'High demand day - add 1 extra technician for morning rush', 'scheduled'),
      (1, '2026-03-20', 'afternoon', 6, 'high', 1.2, '1,2,3', 810.00, 'Peak hours expected 2-5PM - full staff required', 'scheduled'),
      (1, '2026-03-20', 'evening', 3, 'medium', 1.0, '2,3', 382.50, 'Evening demand moderate - standard staffing', 'scheduled'),
      (2, '2026-03-20', 'morning', 4, 'high', 1.2, '4,5', 544.00, 'Good weather driving demand - ensure manager on site', 'scheduled'),
      (2, '2026-03-21', 'morning', 2, 'very_low', 0.3, '4', 216.00, 'Thunderstorm expected - skeleton crew only', 'scheduled'),
      (3, '2026-03-20', 'morning', 4, 'high', 1.1, '6,7', 510.00, 'Strong morning expected - prep supplies early', 'scheduled'),
      (3, '2026-03-20', 'afternoon', 5, 'high', 1.1, '6,7', 637.50, 'Afternoon peak - consider adding express lane', 'scheduled'),
      (4, '2026-03-20', 'morning', 3, 'high', 1.2, '8,9', 408.00, 'Good weather - standard operations', 'scheduled'),
      (5, '2026-03-20', 'morning', 3, 'medium', 0.9, '10,11', 416.50, 'Wind may reduce volume slightly', 'scheduled'),
      (5, '2026-03-20', 'afternoon', 4, 'medium', 0.9, '10,11', 555.00, 'Maintain standard levels despite wind', 'scheduled'),
      (6, '2026-03-20', 'morning', 2, 'high', 1.2, '12', 264.00, 'Small location - 2 staff sufficient for capacity', 'scheduled'),
      (7, '2026-03-20', 'morning', 3, 'medium', 1.0, '13', 396.00, 'Normal operations expected', 'scheduled'),
      (8, '2026-03-20', 'morning', 3, 'high', 1.2, '14', 412.50, 'Push membership sign-ups during peak', 'scheduled'),
      (1, '2026-03-22', 'morning', 2, 'low', 0.4, '1,2', 264.00, 'Rain day - minimal staff, focus on interior services', 'scheduled'),
      (1, '2026-03-22', 'afternoon', 2, 'low', 0.4, '2,3', 255.00, 'Continue low staffing for rain day', 'scheduled')
    `);
    console.log('Staffing Schedules seeded');

    // Seed Revenue Analytics (15 items)
    await client.query(`INSERT INTO revenue_analytics (location_id, date, total_revenue, total_cars, avg_ticket, membership_revenue, walk_in_revenue, top_service, ai_insights) VALUES
      (1, '2026-03-19', 4250.00, 180, 23.61, 1800.00, 2450.00, 'Deluxe Wash', 'Revenue up 12% vs last week. Premium upsells driving growth. Recommend expanding afternoon express lanes.'),
      (1, '2026-03-18', 3800.00, 160, 23.75, 1800.00, 2000.00, 'Premium Wash', 'Steady weekday performance. Membership revenue stable. Walk-in conversion rate improving.'),
      (2, '2026-03-19', 2950.00, 125, 23.60, 1200.00, 1750.00, 'Basic Clean', 'Location performing above average. Weather boost contributed ~15% increase.'),
      (2, '2026-03-18', 2400.00, 105, 22.86, 1200.00, 1200.00, 'Express Wash', 'Tuesday typically slower. Consider mid-week promotions to boost traffic.'),
      (3, '2026-03-19', 3600.00, 150, 24.00, 1500.00, 2100.00, 'Ultimate Clean', 'Strong performance. High-value services popular at this location. Push VIP Detail.'),
      (3, '2026-03-18', 3200.00, 140, 22.86, 1500.00, 1700.00, 'Deluxe Wash', 'Consistent mid-week numbers. Chemical costs slightly high - review dosing.'),
      (4, '2026-03-19', 2800.00, 110, 25.45, 950.00, 1850.00, 'Premium Wash', 'Higher avg ticket than chain average. Premium location advantage.'),
      (5, '2026-03-19', 2100.00, 95, 22.11, 800.00, 1300.00, 'Basic Clean', 'Below target by 8%. Weekend promotion needed to recover.'),
      (6, '2026-03-19', 1650.00, 70, 23.57, 600.00, 1050.00, 'Deluxe Wash', 'Small location at near capacity. Consider extended hours.'),
      (7, '2026-03-19', 2400.00, 100, 24.00, 900.00, 1500.00, 'Premium Wash', 'Solid performance. Bee Cave demographics favor premium services.'),
      (8, '2026-03-19', 1900.00, 85, 22.35, 700.00, 1200.00, 'Basic Clean', 'Georgetown location steady. Student population drives basic wash volume.'),
      (9, '2026-03-19', 1200.00, 50, 24.00, 450.00, 750.00, 'Deluxe Wash', 'Rural location performing as expected. Seasonal uptick starting.'),
      (10, '2026-03-19', 1400.00, 60, 23.33, 500.00, 900.00, 'Express Wash', 'Kyle location growing. New housing developments driving new customers.'),
      (11, '2026-03-19', 1800.00, 75, 24.00, 650.00, 1150.00, 'Premium Wash', 'San Marcos performing well. University traffic boosting weekday numbers.'),
      (12, '2026-03-19', 950.00, 40, 23.75, 300.00, 650.00, 'Basic Clean', 'Buda smallest location. Consider relocation to higher-traffic area.')
    `);
    console.log('Revenue Analytics seeded');

    // Seed Customer Feedback (15 items)
    await client.query(`INSERT INTO customer_feedback (customer_id, location_id, rating, comment, service_date, service_type, sentiment, sentiment_score, ai_analysis, status) VALUES
      (1, 1, 5, 'Amazing wash! My Tesla looks brand new. The touchless option is perfect for my ceramic coating.', '2026-03-18', 'Premium Wash', 'positive', 0.95, 'Highly satisfied customer. Values touchless technology for coated vehicles. Target for VIP upsell.', 'reviewed'),
      (2, 1, 4, 'Good wash overall but had to wait about 15 minutes in line. Maybe need more express lanes?', '2026-03-15', 'Deluxe Wash', 'positive', 0.65, 'Satisfied but notes wait time issue. Peak hour queue management needed at Location 1.', 'reviewed'),
      (3, 2, 3, 'Wash was okay but I noticed some soap residue on the tailgate of my F-150. Large trucks seem to not get full coverage.', '2026-03-17', 'Basic Clean', 'neutral', 0.40, 'Truck coverage issue reported. Recommend adjusting spray nozzle angles for larger vehicles.', 'in_progress'),
      (4, 2, 5, 'Absolutely love the monthly membership! Great value and the staff always recognizes me.', '2026-03-19', 'Monthly Premium', 'positive', 0.98, 'Brand advocate. High lifetime value customer. Personal recognition is key retention factor.', 'reviewed'),
      (5, 3, 2, 'Found water spots all over my BMW after the wash dried. Not acceptable for the price paid.', '2026-03-10', 'Premium Wash', 'negative', 0.15, 'Water quality issue flagged. Check spot-free rinse system at Location 3. Priority follow-up needed.', 'escalated'),
      (6, 3, 4, 'Consistently good service. Been coming here for over a year. The loyalty rewards are a nice touch.', '2026-03-16', 'Deluxe Wash', 'positive', 0.82, 'Loyal customer appreciates rewards program. Retention strategy working well at this location.', 'reviewed'),
      (7, 4, 5, 'The VIP detail is worth every penny. Interior was spotless and the hand wax looks incredible.', '2026-03-12', 'VIP Detail', 'positive', 0.97, 'Premium service satisfaction high. Customer willing to pay for quality. Detail service is profitable.', 'reviewed'),
      (8, 5, 4, 'Nice wash but the vacuum stations could use more suction power. Otherwise great experience.', '2026-03-14', 'Ultimate Clean', 'positive', 0.70, 'Vacuum maintenance needed at Location 5. Overall satisfaction good. Equipment check recommended.', 'in_progress'),
      (9, 5, 2, 'Only used the basic wash and it felt like my truck barely got cleaned. Expected more for the price.', '2026-03-08', 'Basic Clean', 'negative', 0.20, 'Basic wash not meeting expectations for larger vehicles. Consider truck-specific pricing or enhanced basic.', 'reviewed'),
      (10, 6, 5, 'Best car wash in the area! The team is always friendly and my Lexus comes out perfect every time.', '2026-03-19', 'Ultimate Clean', 'positive', 0.99, 'Top customer extremely satisfied. Perfect NPS candidate. Refer-a-friend program opportunity.', 'reviewed'),
      (11, 7, 3, 'The wash was fine but the dryer didn''t work well. Had to towel dry at home.', '2026-03-05', 'Deluxe Wash', 'neutral', 0.35, 'Dryer performance issue at Location 7. Check equipment and add to maintenance schedule.', 'in_progress'),
      (12, 8, 4, 'Great experience! Love the new foam cannon. Really makes a difference in the wash quality.', '2026-03-11', 'Premium Wash', 'positive', 0.85, 'Equipment upgrade positively received. Customer notices quality improvements. Marketing opportunity.', 'reviewed'),
      (13, 9, 4, 'Quick and efficient express wash. In and out in 5 minutes. Perfect for my lunch break.', '2026-03-20', 'Express Wash', 'positive', 0.80, 'Express service meeting time expectations. Lunch rush optimization working well.', 'reviewed'),
      (14, 10, 3, 'Average wash. Nothing special but nothing bad either. Price is fair for what you get.', '2026-03-13', 'Basic Clean', 'neutral', 0.50, 'Neutral experience indicates opportunity for differentiation. Consider adding unique value props.', 'reviewed'),
      (15, 11, 5, 'The ceramic coating safe wash is amazing! Finally a car wash that understands premium vehicle care.', '2026-03-17', 'Ceramic Coating Wash', 'positive', 0.96, 'Specialty service well received by premium vehicle owners. Expand marketing to ceramic coating community.', 'reviewed')
    `);
    console.log('Customer Feedback seeded');

    // Seed Energy Usage (15 items)
    await client.query(`INSERT INTO energy_usage (location_id, date, electricity_kwh, water_gallons, gas_therms, total_cost, cars_washed, cost_per_car, ai_optimization) VALUES
      (1, '2026-03-19', 850.0, 12500.0, 45.0, 425.00, 180, 2.36, 'Water reclamation system saving 30%. Consider LED lighting upgrade for 15% electricity reduction.'),
      (1, '2026-03-18', 780.0, 11000.0, 42.0, 392.00, 160, 2.45, 'Below average day energy use. Off-peak operations reducing costs effectively.'),
      (2, '2026-03-19', 620.0, 9200.0, 35.0, 315.00, 125, 2.52, 'Water usage per car above target. Check for leaks in bay 3 reclaim system.'),
      (2, '2026-03-18', 550.0, 8000.0, 32.0, 280.00, 105, 2.67, 'Higher per-car cost on low volume days. Fixed costs impact smaller locations more.'),
      (3, '2026-03-19', 720.0, 10800.0, 40.0, 365.00, 150, 2.43, 'Energy efficiency improving. New VFD pumps reducing electricity by 12%.'),
      (3, '2026-03-18', 680.0, 10000.0, 38.0, 345.00, 140, 2.46, 'Consistent performance. Gas usage optimal for water heating.'),
      (4, '2026-03-19', 580.0, 8500.0, 30.0, 295.00, 110, 2.68, 'Small location efficient per square foot. Solar panels offsetting 20% of electricity.'),
      (5, '2026-03-19', 500.0, 7500.0, 28.0, 258.00, 95, 2.72, 'Water cost per car highest in chain. Upgrade reclaim system priority.'),
      (6, '2026-03-19', 380.0, 5500.0, 22.0, 198.00, 70, 2.83, 'Smallest location but highest per-car cost. Volume too low for efficiency.'),
      (7, '2026-03-19', 520.0, 7800.0, 30.0, 268.00, 100, 2.68, 'Standard performance. Night lighting optimization could save 8%.'),
      (8, '2026-03-19', 460.0, 6800.0, 26.0, 238.00, 85, 2.80, 'Water heater consuming excess gas. Schedule heating element check.'),
      (9, '2026-03-19', 280.0, 4000.0, 18.0, 148.00, 50, 2.96, 'Low volume impacting efficiency. Consider reduced operating hours on slow days.'),
      (10, '2026-03-19', 340.0, 5000.0, 20.0, 178.00, 60, 2.97, 'Growing location - energy infrastructure upgrade needed for scale.'),
      (11, '2026-03-19', 420.0, 6200.0, 24.0, 218.00, 75, 2.91, 'University location has peak hours. Time-of-use rate optimization recommended.'),
      (12, '2026-03-19', 200.0, 3200.0, 14.0, 108.00, 40, 2.70, 'Smallest volume. Energy per car acceptable. Consider consolidation.')
    `);
    console.log('Energy Usage seeded');

    console.log('\n✅ All seed data inserted successfully!');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
