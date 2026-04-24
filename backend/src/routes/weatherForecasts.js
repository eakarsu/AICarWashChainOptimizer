const createCrudRouter = require('./crud');
module.exports = createCrudRouter('weather_forecasts', { searchFields: ['condition', 'predicted_demand'] });
