const createCrudRouter = require('./crud');
module.exports = createCrudRouter('energy_usage', { orderBy: 'date DESC, id DESC' });
