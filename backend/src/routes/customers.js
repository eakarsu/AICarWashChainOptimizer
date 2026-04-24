const createCrudRouter = require('./crud');
module.exports = createCrudRouter('customers', { searchFields: ['name', 'email', 'vehicle_type'] });
