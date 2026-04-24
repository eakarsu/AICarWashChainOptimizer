const createCrudRouter = require('./crud');
module.exports = createCrudRouter('locations', { searchFields: ['name', 'city', 'address'] });
