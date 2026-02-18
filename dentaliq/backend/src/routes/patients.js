// src/routes/patients.js
const router = require('express').Router();
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const ctrl = require('../controllers/patientController');

// All patient routes require authentication
router.use(authenticate);

router.get('/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim(),
  query('status').optional().isIn(['active', 'inactive', 'archived', '']),
  validate,
  ctrl.list
);

router.get('/:id',
  param('id').isUUID().withMessage('Invalid patient ID'),
  validate,
  ctrl.getOne
);

router.post('/',
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 200 }),
  body('email').optional({ nullable: true, checkFalsy: true }).isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 30 }),
  body('dob').optional({ nullable: true }).isDate().withMessage('Invalid date format (YYYY-MM-DD)'),
  body('medical_notes').optional({ nullable: true }).isString().trim(),
  validate,
  ctrl.create
);

router.patch('/:id',
  param('id').isUUID().withMessage('Invalid patient ID'),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('email').optional({ nullable: true }).isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).isString().trim(),
  body('dob').optional({ nullable: true }).isDate(),
  body('medical_notes').optional({ nullable: true }).isString(),
  body('status').optional().isIn(['active', 'inactive']),
  validate,
  ctrl.update
);

router.delete('/:id',
  param('id').isUUID().withMessage('Invalid patient ID'),
  validate,
  ctrl.remove
);

module.exports = router;
