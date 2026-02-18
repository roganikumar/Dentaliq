// src/middleware/errorHandler.js
const { validationResult } = require('express-validator');

/**
 * Centralized error handler — never leaks stack traces in production
 */
const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+?)\)/)?.[1] || 'field';
    return res.status(409).json({ error: `${field} already exists` });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  console.error(`[${req.method}] ${req.path} — ${err.message}`);
  if (isDev && status === 500) console.error(err.stack);

  res.status(status).json({
    error: message,
    ...(isDev && status === 500 && { stack: err.stack }),
  });
};

/**
 * Validate express-validator results and short-circuit with 400 if invalid
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/**
 * 404 handler — mount last before errorHandler
 */
const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
};

module.exports = { errorHandler, validate, notFound };
