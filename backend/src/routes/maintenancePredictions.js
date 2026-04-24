const createCrudRouter = require('./crud');
module.exports = createCrudRouter('maintenance_predictions', { searchFields: ['risk_level', 'recommended_action', 'status'] });
