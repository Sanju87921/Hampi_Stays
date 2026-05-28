import express from 'express';
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getSponsored,
  createSponsored,
  updateSponsored,
  deleteSponsored,
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience
} from './curation.controller.js';
import { authenticate, authorize } from '../middleware/security.js';

const router = express.Router();

// All curation routes require ADMIN
router.use(authenticate, authorize('ADMIN'));

// Seasonal Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

// Sponsored Placements
router.get('/sponsored', getSponsored);
router.post('/sponsored', createSponsored);
router.put('/sponsored/:id', updateSponsored);
router.delete('/sponsored/:id', deleteSponsored);

// Curated Experiences
router.get('/experiences', getExperiences);
router.post('/experiences', createExperience);
router.put('/experiences/:id', updateExperience);
router.delete('/experiences/:id', deleteExperience);

export default router;
