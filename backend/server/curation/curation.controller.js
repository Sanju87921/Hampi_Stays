import prisma from '../utils/prisma.js';
import { logSecureError } from '../logging/logger.js';

// Seasonal Campaigns
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.seasonalCampaign.findMany({
      orderBy: { priority: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    logSecureError('CURATION_ERROR', 'Failed to get campaigns', { error });
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const campaign = await prisma.seasonalCampaign.create({
      data: req.body
    });
    res.json(campaign);
  } catch (error) {
    logSecureError('CURATION_ERROR', 'Failed to create campaign', { error });
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const campaign = await prisma.seasonalCampaign.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update campaign' });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    await prisma.seasonalCampaign.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
};

// Sponsored Placements
export const getSponsored = async (req, res) => {
  try {
    const sponsored = await prisma.sponsoredPlacement.findMany({
      orderBy: { priority: 'desc' }
    });
    res.json(sponsored);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sponsored placements' });
  }
};

export const createSponsored = async (req, res) => {
  try {
    const sponsored = await prisma.sponsoredPlacement.create({
      data: req.body
    });
    res.json(sponsored);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create sponsored placement' });
  }
};

export const updateSponsored = async (req, res) => {
  try {
    const sponsored = await prisma.sponsoredPlacement.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(sponsored);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sponsored placement' });
  }
};

export const deleteSponsored = async (req, res) => {
  try {
    await prisma.sponsoredPlacement.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sponsored placement' });
  }
};

// Curated Experiences
export const getExperiences = async (req, res) => {
  try {
    const experiences = await prisma.curatedExperience.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
};

export const createExperience = async (req, res) => {
  try {
    const experience = await prisma.curatedExperience.create({
      data: req.body
    });
    res.json(experience);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create experience' });
  }
};

export const updateExperience = async (req, res) => {
  try {
    const experience = await prisma.curatedExperience.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(experience);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update experience' });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    await prisma.curatedExperience.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete experience' });
  }
};
