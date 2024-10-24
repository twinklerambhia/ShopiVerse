const jwt = require('jsonwebtoken');
// const { refreshToken } = require('../controllers/authController');
require('dotenv').config();

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId, tokenType:'access' }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '15m' });
};
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId, tokenType:'refresh' }, process.env.REFRESH_TOKEN_KEY, { expiresIn: '1d' }); // Longer-lived refresh token
};

module.exports = { generateAccessToken, generateRefreshToken };

