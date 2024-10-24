const {  DataTypes } = require('sequelize');
const sequelize = require('../config/config');


const db = {};
console.log('Sequelize Instance:', sequelize);
db.sequelize = sequelize;  // Reference to the sequelize instance
// db.Sequelize = Sequelize;

// Load models
db.User = require('./user')(sequelize, DataTypes);
db.Product = require('./product')(sequelize, DataTypes); // Assuming you have a product model
db.Review = require('./review')(sequelize, DataTypes); 



// Define associations
db.Product.hasMany(db.Review, { foreignKey: 'productId', as: 'Reviews' });
db.Review.belongsTo(db.Product, { foreignKey: 'productId' });

// Sync database with the models
sequelize.sync({ force: false })
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
  });

module.exports = db;  // Export the db object with models and sequelize instance
