const createCrudRouter = require('./crud');
module.exports = createCrudRouter('customer_feedback', { searchFields: ['comment', 'sentiment', 'service_type'] });
