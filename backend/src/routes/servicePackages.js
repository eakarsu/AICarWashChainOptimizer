const createCrudRouter = require('./crud');
module.exports = createCrudRouter('service_packages', { searchFields: ['name', 'wash_type', 'description'] });
