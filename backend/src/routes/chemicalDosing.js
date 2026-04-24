const createCrudRouter = require('./crud');
module.exports = createCrudRouter('chemical_dosing', { searchFields: ['vehicle_soil_level'] });
