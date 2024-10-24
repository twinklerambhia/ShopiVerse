module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      refreshToken: { 
        type: DataTypes.STRING,
        allowNull: true // Can be null if user is logged out
    }
    }, {
      timestamps: true
    });
  
    return User;
  };
  