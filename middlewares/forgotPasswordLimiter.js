const rateLimit = require('express-rate-limit');

// Create rate limiter
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  headers: true, // Include rate limit headers in the response
});

module.exports = forgotPasswordLimiter;
