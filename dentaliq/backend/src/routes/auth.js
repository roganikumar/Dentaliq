// src/routes/auth.js
const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const ctrl = require('../controllers/authController');

router.post('/register',
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 200 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
  ctrl.register
);

router.post('/login',
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
  ctrl.login
);

router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
