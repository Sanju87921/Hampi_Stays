import express from 'express';
import * as resortController from '../controllers/resortController.js';
import { authenticate, authorize, validate } from '../middleware/security.js';
import { body } from 'express-validator';

const router = express.Router();

const resortValidation = [
  body('name').trim().notEmpty(),
  body('description').isLength({ min: 100 }),
  body('price').isFloat({ min: 0 }),
];

router.get('/', resortController.getAllResorts);
router.get('/featured', resortController.getFeaturedResorts);
router.get('/stats', resortController.getStats);
router.get('/:slug', resortController.getResortBySlug);
router.post('/', authenticate, authorize('RESORT_OWNER', 'ADMIN'), resortValidation, validate, resortController.createResort);

export default router;
