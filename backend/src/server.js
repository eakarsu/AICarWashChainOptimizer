const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Env-driven CORS allow-list (comma-separated origins).
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/memberships', require('./routes/memberships'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/chemicals', require('./routes/chemicals'));
app.use('/api/service-packages', require('./routes/servicePackages'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/weather-forecasts', require('./routes/weatherForecasts'));
app.use('/api/chemical-dosing', require('./routes/chemicalDosing'));
app.use('/api/maintenance-predictions', require('./routes/maintenancePredictions'));
app.use('/api/staffing', require('./routes/staffing'));
app.use('/api/revenue', require('./routes/revenue'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/energy', require('./routes/energy'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai', require('./routes/aiNew'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/forecasts', require('./routes/forecasts'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/custom-views', require('./routes/customViews'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));


app.use('/api/ops-manager', require('./routes/opsManagerAgent')); // apply pass 6 — audit custom suggestion

app.use('/api/equipment-rag', require('./routes/equipmentManualRag')); // apply pass 6 — audit custom suggestion

app.use('/api/tank-stream', require('./routes/chemicalTankStream')); // apply pass 6 — audit custom suggestion

app.use('/api/franchise-white-label', require('./routes/franchiseWhiteLabel')); // apply pass 6 — audit custom suggestion
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});


// === Batch 01 Gaps & Frontend Mounts ===
app.use('/api/gap-no-vision-based-vehicle-damage-pre-wash-check', require('./routes/gap_no_vision_based_vehicle_damage_pre_wash_check'));
app.use('/api/gap-no-ai-shift-staffing-recommender-wired-to-weather-', require('./routes/gap_no_ai_shift_staffing_recommender_wired_to_weather_'));
app.use('/api/gap-no-ai-loyalty-program-offer-personalization', require('./routes/gap_no_ai_loyalty_program_offer_personalization'));
app.use('/api/gap-no-ai-dynamic-equipment-health-model-from-sensor-s', require('./routes/gap_no_ai_dynamic_equipment_health_model_from_sensor_s'));
app.use('/api/gap-only-6-frontend-pages-vs-21-backend-routes-ui-gap', require('./routes/gap_only_6_frontend_pages_vs_21_backend_routes_ui_gap'));
app.use('/api/gap-no-sms-email-notification-delivery-channel', require('./routes/gap_no_sms_email_notification_delivery_channel'));
app.use('/api/gap-no-direct-payment-processor-unlimited-wash-subscri', require('./routes/gap_no_direct_payment_processor_unlimited_wash_subscri'));
app.use('/api/gap-no-license-plate-recognition-loyalty-kiosk-integra', require('./routes/gap_no_license_plate_recognition_loyalty_kiosk_integra'));
app.use('/api/gap-no-mobile-app-for-tunnel-attendants', require('./routes/gap_no_mobile_app_for_tunnel_attendants'));
