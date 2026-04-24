const createCrudRouter = require('./crud');
module.exports = createCrudRouter('revenue_analytics', { searchFields: ['top_service'] });
