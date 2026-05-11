import express from 'express';

const router = express.Router();

const ATTRACTIONS = [
  {
    id: "virupaksha",
    title: "Virupaksha Temple",
    category: "Historical",
    description: "The oldest and most sacred temple in Hampi...",
    timing: "6:00 AM - 8:00 PM",
    fee: "₹50 (Indians) / ₹500 (Foreigners)",
    image: "/images/hampi-1.png",
    highlights: ["Inverted shadow of the gopuram", "Ancient inscriptions", "Live temple elephant 'Lakshmi'"]
  },
  // ... other attractions
];

const POINTS_OF_INTEREST = [
  // ... POIs
];

router.get('/attractions', (req, res) => res.json(ATTRACTIONS));
router.get('/poi', (req, res) => res.json(POINTS_OF_INTEREST));

export default router;
