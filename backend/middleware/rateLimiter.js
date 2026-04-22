const rateLimit = require('express-rate-limit');

const createRegisterLimiter = () => rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const createResendLimiter = () => rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 resend requests per hour
    message: { error: 'Too many resend attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { createRegisterLimiter, createResendLimiter };
