const createCrudRouter = require('./crud');
module.exports = createCrudRouter('chemicals', { searchFields: ['name', 'type', 'supplier'] });
