import { useState, useEffect } from "react";
import { apiClient } from "../../utils/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Landmark, ArrowRight, Sparkles, X, Loader2, Navigation, Map } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import { ImmersiveBackground } from "../../components/layout/ImmersiveBackground";
import { PremiumIcon } from "../../components/ui/PremiumIcon";

// Import Leaflet packages for satellite hybrid maps
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const DISCOVERY_IMAGES = [
  "https://images.unsplash.com/photo-1581012771300-224937651c42?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581012771300-224937651c42?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590050752117-23a9d7f28a97?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524230652367-a7ff3337f7e7?q=80&w=2070&auto=format&fit=crop"
];

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

const COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  vittala: { lat: 15.3429, lng: 76.4789 },
  virupaksha: { lat: 15.3353, lng: 76.4593 },
  hemakuta: { lat: 15.3340, lng: 76.4585 },
  lotus: { lat: 15.3197, lng: 76.4674 },
  elephant: { lat: 15.3204, lng: 76.4704 },
  matanga: { lat: 15.3312, lng: 76.4652 },
  queensbath: { lat: 15.3134, lng: 76.4677 },
  hampibazaar: { lat: 15.3352, lng: 76.4633 },
};

export function DiscoveryPage() {
  const [viewMode, setViewMode] = useState<"ancient" | "satellite">("ancient");
  const [pointsOfInterest, setPointsOfInterest] = useState<POI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [hoveredPOI, setHoveredPOI] = useState<POI | null>(null);
  const [poiErrors, setPoiErrors] = useState<Record<string, boolean>>({});
  const [guideServiceEnabled, setGuideServiceEnabled] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await apiClient.get<any>('/settings');
      if (data && typeof data.guideServiceEnabled !== 'undefined') {
        setGuideServiceEnabled(data.guideServiceEnabled);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  useEffect(() => {
    fetchSettings();
    const fetchPOI = async () => {
      try {
        const data = await apiClient.get<POI[]>('/heritage/poi');
        
        // Static fallbacks for missing points of interest to guarantee 8 premium Hampi landmarks are fully mapped
        const defaultPOIs: POI[] = [
          {
            id: "vittala",
            name: "Vittala Temple Complex",
            category: "Architecture",
            x: 82,
            y: 24,
            description: "An architectural masterpiece famous for its iconic Stone Chariot, musical monolithic pillars, and stunning carvings depicting ancient Vijayanagara heritage.",
            image: "https://images.unsplash.com/photo-1581012771300-224937651c42?q=80&w=1200",
            recommendedTours: ["Sunrise Raga Photography", "Stones That Sing Music Session"],
            nearbyResort: "Evolve Back Hampi"
          },
          {
            id: "virupaksha",
            name: "Virupaksha Temple Complex",
            category: "Heritage",
            x: 24,
            y: 35,
            description: "Hampi's oldest functioning temple, dedicated to Lord Shiva, featuring an iconic nine-tiered entrance gopuram towering gracefully above the sacred Tungabhadra River.",
            image: "https://images.unsplash.com/photo-1581012771300-224937651c42?q=80&w=1200",
            recommendedTours: ["Evening Sacred Aarti Experience", "Virupaksha Mythological Trek"],
            nearbyResort: "Heritage Resort Hampi"
          },
          {
            id: "hemakuta",
            name: "Hemakuta Hills Sanctuary",
            category: "Nature",
            x: 21,
            y: 45,
            description: "A sloping rocky expanse scattered with ancient pre-Vijayanagara temples, monolithic structures, and the absolute best sunset viewpoints in all of Karnataka.",
            image: "https://images.unsplash.com/photo-1590050752117-23a9d7f28a97?q=80&w=1200",
            recommendedTours: ["Sun-Set Serenade Walk", "Monolithic Sculpture Masterclass"],
            nearbyResort: "Hampi's Boulders Resort"
          },
          {
            id: "lotus",
            name: "Lotus Mahal Enclosure",
            category: "Architecture",
            x: 52,
            y: 65,
            description: "A beautiful, air-cooled two-story pleasure palace showcasing a marvelous synthesis of Indo-Islamic architecture, with arches mimicking lotus petals.",
            image: "https://images.unsplash.com/photo-1524230652367-a7ff3337f7e7?q=80&w=1200",
            recommendedTours: ["Zenana Court Promenade", "Royal Hydrological Innovations Hike"],
            nearbyResort: "Kamalapura Luxury Palace"
          },
          {
            id: "elephant",
            name: "Royal Elephant Stables",
            category: "Architecture",
            x: 65,
            y: 60,
            description: "A grand domed building used to house the royal state elephants of the Vijayanagara Empire, highlighting symmetrical chambers and beautiful central towers.",
            image: "https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=1200",
            recommendedTours: ["Royal Stables Photo Session", "Vijayanagara History Walk"],
            nearbyResort: "Evolve Back Hampi"
          },
          {
            id: "matanga",
            name: "Matanga Sunrise Peak",
            category: "Nature",
            x: 48,
            y: 42,
            description: "The highest point in Hampi, offering a stunning 360-degree aerial panorama of the entire ancient ruins landscape at sunrise.",
            image: "https://images.unsplash.com/photo-1590050752117-23a9d7f28a97?auto=format&fit=crop&q=80&w=1200",
            recommendedTours: ["Early Morning Sunrise Trek", "Vantage Point Photo Expedition"],
            nearbyResort: "Heritage Resort Hampi"
          },
          {
            id: "queensbath",
            name: "The Queen's Bath Enclosure",
            category: "Heritage",
            x: 55,
            y: 80,
            description: "A royal bath enclosure styled in beautiful Indo-Islamic style, featuring an ornamental moat and exquisite balconies overhanging the bathing pool.",
            image: "https://images.unsplash.com/photo-1524230652367-a7ff3337f7e7?auto=format&fit=crop&q=80&w=1200",
            recommendedTours: ["Zenana Hydro-Engineering Walk", "Royal Bathing Customs Heritage Hike"],
            nearbyResort: "Kamalapura Luxury Palace"
          },
          {
            id: "hampibazaar",
            name: "Historic Hampi Bazaar Street",
            category: "Heritage",
            x: 32,
            y: 32,
            description: "A historic avenue aligned with ancient double-story colonnaded stone pavilions, stretching out from Virupaksha Temple to the foothills of Matanga.",
            image: "https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=1200",
            recommendedTours: ["Bazaar Walk & Local Crafts", "Sacred Virupaksha Heritage Hike"],
            nearbyResort: "Hampi's Boulders Resort"
          }
        ];

        // Merge fetched and static landmarks to ensure completeness
        const merged = (data && data.length > 0) ? [...data] : [];
        defaultPOIs.forEach(item => {
          if (!merged.some(m => m.id === item.id)) {
            merged.push(item);
          }
        });

        setPointsOfInterest(merged);
      } catch (err) {
        console.error("Failed to fetch POIs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPOI();
  }, []);

  if (!guideServiceEnabled) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center pt-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <PremiumIcon icon={Compass} variant="gold" size="xl" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Discovery <span className="text-gold-400 italic">Paused</span></h1>
            <p className="text-lg text-white/60 leading-relaxed mb-10">
              Our interactive mapping project is currently undergoing data synchronization. 
              Please check back soon for the updated heritage grid.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/resorts">
                <Button className="h-14 px-8 rounded-2xl bg-gold-500 text-navy-950 w-full sm:w-auto">Explore Stays</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/20 text-white w-full sm:w-auto">Home</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 overflow-hidden relative">
      {/* Cinematic Background */}
      <ImmersiveBackground images={DISCOVERY_IMAGES} height="h-full" overlayColor="from-navy-950/90 via-navy-950/50 to-navy-950" interval={3500} />

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-20 h-[calc(100vh-80px)] flex flex-col">
        {/* Header containing the map toggle switch */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400 mb-4"
            >
              <PremiumIcon icon={Compass} size="sm" variant="gold" className="mr-2" /> Interactive Expedition
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif font-bold text-white mb-2"
            >
              Ruins of <span className="text-gold-400 italic">Hampi</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 max-w-xl text-sm leading-relaxed"
            >
              Cartographic explorer linking legendary sacred centers with luxury stays.
            </motion.p>
          </div>

          {/* Premium Map Type Selector Toggle */}
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-2 self-start md:self-end">
            <button
              onClick={() => setViewMode("ancient")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2",
                viewMode === "ancient"
                  ? "bg-gold-500 text-navy-950 shadow-gold"
                  : "text-white hover:bg-white/5"
              )}
            >
              <Map className="w-3.5 h-3.5" />
              Cartography Grid
            </button>
            <button
              onClick={() => setViewMode("satellite")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2",
                viewMode === "satellite"
                  ? "bg-gold-500 text-navy-950 shadow-gold"
                  : "text-white hover:bg-white/5"
              )}
            >
              <Navigation className="w-3.5 h-3.5" />
              Google Satellite
            </button>
          </div>
        </header>

        {/* Map Explorer Area */}
        <div className="flex-1 relative bg-white/5 backdrop-blur-sm rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden group">
          {/* Loading State Overlay */}
          {isLoading && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-navy-950/80 backdrop-blur-md">
                <Loader2 className="w-16 h-16 animate-spin text-gold-500 mb-6" />
                <p className="text-gold-400 font-bold uppercase tracking-[0.3em] text-xs animate-pulse">Initializing Heritage Grid...</p>
             </div>
          )}

          {/* View Mode 1: Ancient styled percentage map */}
          {viewMode === "ancient" ? (
            <div className="w-full h-full relative">
              {/* Stylized Map Grid overlay */}
              <div className="absolute inset-0 opacity-10 pointer-events-none z-0">
                <div className="w-full h-full grid grid-cols-12 grid-rows-12">
                  {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className="border border-white/10" />
                  ))}
                </div>
              </div>

              {/* Pins layer */}
              {pointsOfInterest.map((poi) => (
                <motion.button
                  key={poi.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + pointsOfInterest.indexOf(poi) * 0.05 }}
                  onMouseEnter={() => setHoveredPOI(poi)}
                  onMouseLeave={() => setHoveredPOI(null)}
                  onClick={() => setSelectedPOI(poi)}
                  className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 group/pin"
                  style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
                >
                  <div className="relative">
                    {/* Ping Animation */}
                    <div className="absolute -inset-4 bg-gold-500/25 rounded-full animate-ping opacity-40" />
                    
                    <PremiumIcon 
                      icon={Landmark} 
                      variant={selectedPOI?.id === poi.id ? "gold" : "navy"} 
                      size="md"
                      className={cn(
                        "transition-all duration-500 border border-white/10",
                        selectedPOI?.id === poi.id ? "scale-125" : "hover:scale-110"
                      )}
                    />

                    {/* Hover Label */}
                    <AnimatePresence>
                      {(hoveredPOI?.id === poi.id && !selectedPOI) && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 20 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="absolute left-10 top-1/2 -translate-y-1/2 bg-navy-950/90 text-gold-400 border border-gold-500/30 px-4 py-2 rounded-xl shadow-2xl whitespace-nowrap z-40"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-widest">{poi.name}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              ))}

              {/* Stylized River Element */}
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
          ) : (
            /* View Mode 2: Interactive Leaflet Map using Google Satellite Hybrid Tiles */
            <div className="w-full h-full relative z-10">
              <MapContainer 
                center={[15.333, 76.468]} 
                zoom={14} 
                className="w-full h-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; Google Satellite Hybrid Maps'
                  url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                />
                {pointsOfInterest.map((poi) => {
                  const coords = COORDINATES_MAP[poi.id] || { lat: 15.335, lng: 76.46 };
                  return (
                    <Marker 
                      key={poi.id} 
                      position={[coords.lat, coords.lng]}
                      eventHandlers={{
                        click: () => {
                          setSelectedPOI(poi);
                        }
                      }}
                    >
                      <Popup className="hampi-satellite-popup">
                        <div className="p-2 w-52 text-navy-950 font-serif">
                          <span className="text-[8px] font-black uppercase text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full mb-1 inline-block">
                            {poi.category}
                          </span>
                          <h4 className="font-bold text-xs mb-1 text-navy-950">{poi.name}</h4>
                          <p className="text-[9px] text-navy-950/60 leading-normal mb-3">{poi.description.substring(0, 70)}...</p>
                          <Button 
                            size="xs" 
                            className="w-full bg-navy-950 text-white hover:bg-navy-900 border-none font-bold py-1 px-2 rounded-lg text-[9px]"
                            onClick={() => setSelectedPOI(poi)}
                          >
                            Inspect Heritage Details
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}

          {/* Point-Of-Interest Information Slide Drawer */}
          <AnimatePresence>
            {selectedPOI && (
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className="absolute top-6 bottom-6 right-6 w-96 z-50 pointer-events-none"
              >
                <div className="w-full h-full bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-luxury p-8 flex flex-col pointer-events-auto border border-sand-200/60 overflow-hidden relative">
                  <button 
                    onClick={() => setSelectedPOI(null)}
                    className="absolute top-6 right-6 w-9 h-9 rounded-full bg-sand-100 flex items-center justify-center text-navy-950/40 hover:bg-navy-950 hover:text-white transition-all z-20 shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-hide">
                    {/* Header Image */}
                    <div className="relative h-48 -mx-8 -mt-8 mb-6 overflow-hidden">
                      <img 
                        src={poiErrors[selectedPOI.id] ? "https://images.unsplash.com/photo-1581012771300-224937651c42?q=80&w=1200" : selectedPOI.image} 
                        className="w-full h-full object-cover rounded-b-[2rem]" 
                        onError={() => setPoiErrors(prev => ({ ...prev, [selectedPOI.id]: true }))}
                        alt={selectedPOI.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-6">
                         <span className="px-3 py-1 bg-gold-500 text-navy-950 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg">
                           {selectedPOI.category}
                         </span>
                      </div>
                    </div>

                    {/* POI Description */}
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-navy-950 mb-3">{selectedPOI.name}</h2>
                      <p className="text-navy-950/60 leading-relaxed text-xs">
                        {selectedPOI.description}
                      </p>
                    </div>

                    {/* Google Maps Directions Integration */}
                    {(() => {
                      const coords = COORDINATES_MAP[selectedPOI.id] || { lat: 15.335, lng: 76.46 };
                      return (
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button className="w-full h-12 rounded-2xl bg-navy-950 text-white hover:bg-navy-900 border border-white/10 gap-2 flex items-center justify-center font-bold text-xs uppercase tracking-wider shadow-md">
                            <Navigation className="w-3.5 h-3.5 text-gold-400" />
                            Navigate with Google Maps
                          </Button>
                        </a>
                      );
                    })()}

                    {/* Tour Recommendations */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-bold text-navy-950/40 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-gold-500" /> Recommended Excursions
                      </p>
                      <div className="space-y-2">
                        {selectedPOI.recommendedTours.map(tour => (
                          <div key={tour} className="p-3.5 rounded-2xl bg-sand-50/50 border border-sand-100 flex items-center justify-between group hover:border-gold-300 transition-all cursor-pointer">
                            <span className="text-xs font-bold text-navy-950">{tour}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-gold-500 group-hover:translate-x-1 transition-transform" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nearby Resort recommendation */}
                    <div className="p-5 rounded-3xl bg-navy-950 text-white relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
                       <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Nearby Sanctuary</p>
                       <h4 className="text-sm font-serif font-bold mb-3">{selectedPOI.nearbyResort}</h4>
                       <Link to="/resorts">
                         <Button size="sm" className="w-full bg-white text-navy-950 hover:bg-gold-500 border-none font-black text-[10px] tracking-wider uppercase">
                           Secure Your Stay
                         </Button>
                       </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legend / Status Footer */}
        <footer className="mt-6 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-white/40">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gold-500 shadow-gold" /> Monument Complex
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-navy-600 border border-white/20" /> Natural Sanctuary
              </div>
           </div>
           <p className="text-white/20 italic">Hampi Heritage Mapping Project v2.5 • Google Satellite Hybrid Connected</p>
        </footer>
      </div>
    </div>
  );
}
