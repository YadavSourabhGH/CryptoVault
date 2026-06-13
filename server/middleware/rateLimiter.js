const rateLimit = require('express-rate-limit');

// Check if we are in development environment
const isDev = process.env.NODE_ENV !== 'production';

// General rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 300, // Limit each IP to 10000 requests in dev, 300 in prod
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

// Stricter rate limiter for auth (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 50, // Limit each IP to 1000 attempts in dev, 50 in prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
});

module.exports = { apiLimiter, authLimiter };
