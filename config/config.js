const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize the Sequelize instance using environment variables or defaults
const sequelize = new Sequelize(
  process.env.DB_NAME || 'ecommerce_db', 
  process.env.DB_USERNAME || 'root', 
  process.env.DB_PASSWORD || '', 
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: "mysql",  // This is important to include the dialect
  }
);

module.exports = sequelize;
