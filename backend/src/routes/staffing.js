const createCrudRouter = require('./crud');
module.exports = createCrudRouter('staffing_schedules', { searchFields: ['shift', 'predicted_demand', 'status'] });
