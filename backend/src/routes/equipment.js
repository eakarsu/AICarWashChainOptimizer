const createCrudRouter = require('./crud');
module.exports = createCrudRouter('equipment', { searchFields: ['name', 'type', 'manufacturer'] });
