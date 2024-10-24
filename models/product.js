const { DataTypes } = require('sequelize');
const sequelize = require('../config/config');

module.exports=(sequelize,DataTypes)=>{
    const Product= sequelize.define('Product',{
        name: {
            type: DataTypes.STRING,
            allowNull: false
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: false
          },
          price: {
            type: DataTypes.FLOAT,
            allowNull: false
          },
          quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
          },
          inStock: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
          }
    }, {
        timestamps: true
});
    
    return Product;
};

 

