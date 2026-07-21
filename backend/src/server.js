const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const auth = require('./middleware/auth');
const { validateRuntime } = require('./config/runtime');

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
app.use('/api/operating-lifecycle', auth, require('./routes/operatingLifecycle'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));


app.use('/api/ops-manager', require('./routes/opsManagerAgent')); // apply pass 6 — audit custom suggestion

app.use('/api/equipment-rag', require('./routes/equipmentManualRag')); // apply pass 6 — audit custom suggestion

app.use('/api/tank-stream', require('./routes/chemicalTankStream')); // apply pass 6 — audit custom suggestion

app.use('/api/franchise-white-label', require('./routes/franchiseWhiteLabel')); // apply pass 6 — audit custom suggestion
validateRuntime();
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

