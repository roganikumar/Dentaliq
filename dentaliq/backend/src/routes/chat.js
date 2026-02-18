// src/routes/chat.js
const router = require('express').Router();
const { body, param } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const ctrl = require('../controllers/chatController');

// Tighter rate limit for AI-backed endpoint
const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 20,                   // 20 messages per minute per IP
  message: { error: 'Too many messages, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

// GET /chat/:patientId — chat history
router.get('/:patientId',
  param('patientId').isUUID().withMessage('Invalid patient ID'),
  validate,
  ctrl.history
);

// POST /chat — send message
router.post('/',
  chatRateLimit,
  body('patientId').isUUID().withMessage('Valid patientId UUID required'),
  body('message').trim().notEmpty().withMessage('Message cannot be empty').isLength({ max: 2000 }),
  validate,
  ctrl.send
);

module.exports = router;
