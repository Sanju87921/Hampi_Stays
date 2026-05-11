import express from 'express';

const router = express.Router();

const ATTRACTIONS = [
  {
    id: "virupaksha",
    title: "Virupaksha Temple",
    category: "Historical",
    description: "The oldest and most sacred temple in Hampi, dedicated to Lord Shiva. It has remained active since the 7th century.",
    timing: "6:00 AM - 8:00 PM",
    fee: "₹50 (Indians) / ₹500 (Foreigners)",
    image: "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2000",
    highlights: ["Inverted shadow of the gopuram", "Ancient inscriptions", "Live temple elephant 'Lakshmi'"]
  },
  {
    id: "vittala",
    title: "Vittala Temple",
    category: "Historical",
    description: "Famous for its musical pillars and the iconic Stone Chariot, it represents the pinnacle of Vijayanagara architecture.",
    timing: "8:30 AM - 5:30 PM",
    fee: "₹40 (Indians) / ₹600 (Foreigners)",
    image: "https://images.unsplash.com/photo-1590050752117-23a9d7f28a97?auto=format&fit=crop&q=80&w=2000",
    highlights: ["The Stone Chariot", "Musical Pillars", "Maha Mantapa"]
  }
];

const POINTS_OF_INTEREST = [
  {
    id: "poi-1",
    name: "Virupaksha Complex",
    category: "Architecture",
    x: 42,
    y: 38,
    description: "The spiritual epicentre of Hampi. This temple survived the 1565 destruction of the city.",
    image: "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2000",
    recommendedTours: ["Sunrise Spiritual Walk", "Twilight Photography"],
    nearbyResort: "Hampi Heritage House"
  },
  {
    id: "poi-2",
    name: "Stone Chariot",
    category: "Heritage",
    x: 68,
    y: 25,
    description: "One of India's three famous stone chariots, a miniature temple carved from a single block of granite.",
    image: "https://images.unsplash.com/photo-1590050752117-23a9d7f28a97?auto=format&fit=crop&q=80&w=2000",
    recommendedTours: ["The Vittala Expedition", "Cycle Through History"],
    nearbyResort: "Vittala Riverside Retreat"
  },
  {
    id: "poi-3",
    name: "Lotus Mahal",
    category: "Architecture",
    x: 55,
    y: 65,
    description: "A beautiful example of Indo-Islamic architecture, part of the Zenana Enclosure.",
    image: "https://images.unsplash.com/photo-1600100397608-f090747e2f9d?q=80&w=2070&auto=format&fit=crop",
    recommendedTours: ["Royal Enclosure Walk"],
    nearbyResort: "The Royal Orchard"
  },
  {
    id: "poi-4",
    name: "Matanga Hill",
    category: "Nature",
    x: 48,
    y: 48,
    description: "The highest point in Hampi, offering a 360-degree view of the boulder-strewn landscape.",
    image: "https://images.unsplash.com/photo-1524230652367-a7ff3337f7e7?q=80&w=2070&auto=format&fit=crop",
    recommendedTours: ["Sunset Boulder Trek"],
    nearbyResort: "Matanga Boulders Eco-Stay"
  },
  {
    id: "poi-5",
    name: "Elephant Stables",
    category: "Heritage",
    x: 62,
    y: 72,
    description: "Grand domed structures built to house the ceremonial elephants of the Vijayanagara kings.",
    image: "https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=2000",
    recommendedTours: ["The Royal Stables Walk"],
    nearbyResort: "Grand Elephant Resort"
  }
];

router.get('/attractions', (req, res) => res.json(ATTRACTIONS));
router.get('/poi', (req, res) => res.json(POINTS_OF_INTEREST));

export default router;
