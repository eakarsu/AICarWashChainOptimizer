const createCrudRouter = require('./crud');
module.exports = createCrudRouter('memberships', { searchFields: ['customer_name', 'email', 'plan_type'] });
