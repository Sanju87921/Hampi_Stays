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
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Seasonal Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', requireAdmin, createCampaign);
router.put('/campaigns/:id', requireAdmin, updateCampaign);
router.delete('/campaigns/:id', requireAdmin, deleteCampaign);

// Sponsored Placements
router.get('/sponsored', getSponsored);
router.post('/sponsored', requireAdmin, createSponsored);
router.put('/sponsored/:id', requireAdmin, updateSponsored);
router.delete('/sponsored/:id', requireAdmin, deleteSponsored);

// Curated Experiences
router.get('/experiences', getExperiences);
router.post('/experiences', requireAdmin, createExperience);
router.put('/experiences/:id', requireAdmin, updateExperience);
router.delete('/experiences/:id', requireAdmin, deleteExperience);

export default router;
