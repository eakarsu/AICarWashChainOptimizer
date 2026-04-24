const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
