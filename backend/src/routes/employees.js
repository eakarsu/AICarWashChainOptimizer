const createCrudRouter = require('./crud');
module.exports = createCrudRouter('employees', { searchFields: ['name', 'email', 'role'] });
