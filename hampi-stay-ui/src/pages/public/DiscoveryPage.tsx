import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Landmark, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";

interface POI {
  id: string;
  name: string;
  category: "Architecture" | "Heritage" | "Nature";
  x: number; // Percentage from left
  y: number; // Percentage from top
  description: string;
  image: string;
  recommendedTours: string[];
  nearbyResort: string;
}

const pointsOfInterest: POI[] = [
  {
    id: "vittala",
    name: "Vittala Temple",
    category: "Architecture",
    x: 75,
    y: 35,
    description: "The architectural pinnacle of Hampi, famous for its musical pillars and the iconic stone chariot.",
    image: "https://images.unsplash.com/photo-1642516863984-68fdeea5ba64?auto=format&fit=crop&q=80&w=2000",
    recommendedTours: ["Vittala Musical Pillars Deep-Dive", "Stone Chariot Photography"],
    nearbyResort: "Evolve Back Kamlapura"
  },
  {
    id: "virupaksha",
    name: "Virupaksha Temple",
    category: "Heritage",
    x: 25,
    y: 40,
    description: "The oldest and most sacred temple in Hampi, dedicated to Lord Shiva, with a towering 50-meter gopuram.",
    image: "https://images.unsplash.com/photo-1581391528803-5eba57ac1f2d?auto=format&fit=crop&q=80&w=2000",
    recommendedTours: ["Main Bazaar Walk", "Sacred Center Sunrise Tour"],
    nearbyResort: "Hampi Heritage Resort"
  },
  {
    id: "matanga",
    name: "Matanga Hill",
    category: "Nature",
    x: 45,
    y: 45,
    description: "The highest point in Hampi offering a breathtaking 360-degree view of the entire landscape.",
    image: "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2000",
    recommendedTours: ["Sunrise Trek", "Bouldering Adventure"],
    nearbyResort: "Whispering Rocks"
  },
  {
    id: "lotus",
    name: "Lotus Mahal",
    category: "Architecture",
    x: 35,
    y: 65,
    description: "An elegant two-story pavilion showcasing a unique blend of Indo-Islamic architecture.",
    image: "https://images.unsplash.com/photo-1588319648913-0ff4b76a9fed?auto=format&fit=crop&q=80&w=2000",
    recommendedTours: ["Royal Enclosure Walk", "Women of Vijayanagara Tour"],
    nearbyResort: "Heritage Resort Hampi"
  },
  {
    id: "bazaar",
    name: "Hampi Bazaar",
    category: "Heritage",
    x: 30,
    y: 35,
    description: "Once a bustling trade center for diamonds and spices, now a row of ancient stone pavilions.",
    image: "https://images.unsplash.com/photo-1596018382916-56d2e341d784?auto=format&fit=crop&q=80&w=2000",
    recommendedTours: ["Forgotten Village Cycle Tour", "Bazaar Street Stories"],
    nearbyResort: "The Hyatt Place"
  }
];

export function DiscoveryPage() {
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [hoveredPOI, setHoveredPOI] = useState<POI | null>(null);

  return (
    <div className="min-h-screen bg-navy-950 overflow-hidden relative">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-transparent to-navy-950 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent opacity-50" />
        <img 
          src="https://images.unsplash.com/photo-1581391528803-5eba57ac1f2d?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-30 scale-110 animate-slow-zoom blur-sm"
          alt="Hampi Background"
        />
      </div>

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-20 h-screen flex flex-col">
        {/* Header */}
        <header className="mb-12 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400 mb-6"
          >
            <Compass className="w-3.5 h-3.5" /> Interactive Expedition
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif font-bold text-white mb-6"
          >
            Map of the <span className="text-gold-400 italic">Ancients</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/40 max-w-xl text-lg leading-relaxed"
          >
            A curated cartographic journey through Hampi's royal and sacred centers. 
            Click the golden icons to reveal hidden stories and luxury stays.
          </motion.p>
        </header>

        {/* Map Container */}
        <div className="flex-1 relative bg-white/5 backdrop-blur-sm rounded-[4rem] border border-white/10 shadow-2xl overflow-hidden group">
          {/* Stylized Map Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="w-full h-full grid grid-cols-12 grid-rows-12">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
          </div>

          {/* Points of Interest */}
          {pointsOfInterest.map((poi) => (
            <motion.button
              key={poi.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + pointsOfInterest.indexOf(poi) * 0.1 }}
              onMouseEnter={() => setHoveredPOI(poi)}
              onMouseLeave={() => setHoveredPOI(null)}
              onClick={() => setSelectedPOI(poi)}
              className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 group/pin"
              style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
            >
              <div className="relative">
                {/* Ping Animation */}
                <div className="absolute -inset-4 bg-gold-500/20 rounded-full animate-ping" />
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl border-2 ${
                  selectedPOI?.id === poi.id 
                    ? "bg-gold-500 border-white text-navy-950 scale-125" 
                    : "bg-navy-950/90 backdrop-blur-md border-gold-500/50 text-gold-500 hover:border-white hover:text-white"
                }`}>
                  <Landmark className="w-6 h-6" />
                </div>

                {/* Hover Label */}
                <AnimatePresence>
                  {(hoveredPOI?.id === poi.id && !selectedPOI) && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 20 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="absolute left-10 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-xl shadow-2xl whitespace-nowrap z-40"
                    >
                      <p className="text-xs font-bold text-navy-950 uppercase tracking-widest">{poi.name}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          ))}

          {/* River / Landscape Elements (Visual only) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <path 
              d="M 10 30 Q 30 40 50 20 T 90 40" 
              fill="none" 
              stroke="#fbbf24" 
              strokeWidth="2" 
              strokeDasharray="10 5"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Info Panel Overlay */}
        <AnimatePresence>
          {selectedPOI && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="absolute top-32 bottom-20 right-8 w-96 z-50 pointer-events-none"
            >
              <div className="w-full h-full bg-white rounded-[3rem] shadow-luxury p-8 flex flex-col pointer-events-auto border border-sand-100 overflow-hidden relative">
                <button 
                  onClick={() => setSelectedPOI(null)}
                  className="absolute top-8 right-8 w-10 h-10 rounded-full bg-sand-100 flex items-center justify-center text-navy-950/40 hover:bg-navy-950 hover:text-white transition-all z-20 shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide">
                  <div className="relative h-64 -mx-8 -mt-8 mb-8 overflow-hidden">
                    <img src={selectedPOI.image} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-8">
                       <span className="px-3 py-1 bg-gold-500 text-navy-950 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                         {selectedPOI.category}
                       </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-serif font-bold text-navy-950 mb-4">{selectedPOI.name}</h2>
                    <p className="text-navy-950/60 leading-relaxed text-sm">
                      {selectedPOI.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-gold-500" /> Curated Experiences
                    </p>
                    <div className="space-y-2">
                      {selectedPOI.recommendedTours.map(tour => (
                        <div key={tour} className="p-4 rounded-2xl bg-sand-50 border border-sand-100 flex items-center justify-between group hover:border-gold-300 transition-all cursor-pointer">
                          <span className="text-xs font-bold text-navy-950">{tour}</span>
                          <ArrowRight className="w-4 h-4 text-gold-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-navy-950 text-white relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl -mr-16 -mt-16" />
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Nearby Sanctuary</p>
                     <h4 className="text-lg font-serif font-bold mb-4">{selectedPOI.nearbyResort}</h4>
                     <Link to="/resorts">
                       <Button size="sm" className="w-full bg-white text-navy-950 hover:bg-gold-500 border-none font-bold">
                         Secure Your Stay
                       </Button>
                     </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Hint */}
        <footer className="mt-8 flex justify-between items-center">
           <div className="flex items-center gap-6 text-white/40 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gold-500" /> Monument
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/20" /> Landmark
              </div>
           </div>
           <p className="text-white/20 text-[10px] uppercase tracking-widest italic">Hampi Heritage Mapping Project v2.0</p>
        </footer>
      </div>
    </div>
  );
}
