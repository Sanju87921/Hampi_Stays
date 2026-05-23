import express from 'express';
import * as ownerController from '../controllers/ownerController.js';
import { authenticate } from '../middleware/security.js';

const router = express.Router();

// All owner routes require authentication
router.use(authenticate);

/**
 * @route GET /api/owners/:userId/profile
 * @desc Get owner profile (user + owner record)
 */
router.get('/:userId/profile', ownerController.getOwnerProfile);

/**
 * @route PATCH /api/owners/:userId/profile
 * @desc Update owner profile (user fields + business fields)
 */
router.patch('/:userId/profile', ownerController.updateOwnerProfile);

/**
 * @route GET /api/owners/:userId/resorts
 * @desc Get all resorts for an owner
 */
router.get('/:userId/resorts', ownerController.getOwnerResorts);

/**
 * @route GET /api/owners/:userId/stats
 * @desc Get dashboard stats for an owner
 */
router.get('/:userId/stats', ownerController.getOwnerStats);

export default router;
