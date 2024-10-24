const rateLimit = require('express-rate-limit');

const resetPasswordLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, // Limit to 3 requests per window
    message: 'Too many reset password requests, please try again later.',
    headers: true,
  });
  module.exports = resetPasswordLimiter;