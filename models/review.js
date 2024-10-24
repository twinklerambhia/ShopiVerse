const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

// Import Product model after defining Review
const Product = require('./product')(sequelize, DataTypes);

module.exports=(sequelize, DataTypes)=>{
  const Review = sequelize.define('Review', {
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      references: {
        model: Product,
        key: 'id'
      }
    }
  }, {
    timestamps: true
  });
 



// Define relationship (1 Product -> many Reviews)
Product.hasMany(Review, { foreignKey: 'productId', as:'Reviews' });
Review.belongsTo(Product, { foreignKey: 'productId' });


return Review;
};