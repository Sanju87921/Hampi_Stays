import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, Clock, Camera, 
  Info, Compass, Loader2,
  Sunrise, ShieldCheck, Map as MapIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { apiClient } from "../../utils/apiClient";

export function HampiGuidePage() {
  const [attractions, setAttractions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        const data = await apiClient.get<any[]>('/heritage/attractions');
        setAttractions(data);
      } catch (err) {
        console.error("Failed to fetch heritage sites", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttractions();
  }, []);

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=2000" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
          alt="Hampi Heritage"
        />
        <div className="absolute inset-0 bg-navy-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-sand-50 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-flex items-center gap-2 bg-gold-500 text-navy-950 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              <Compass className="w-4 h-4" /> Destination Guide
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 text-shadow-lg">
              Explore the <span className="italic text-gold-400">Eternal City</span>
            </h1>
            <p className="text-sand-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-shadow-md">
              A curated guide to the most iconic monuments, hidden trails, and sacred sites within the UNESCO World Heritage Site of Hampi.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Guide Content */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main List */}
          <div className="lg:col-span-8 space-y-16">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-gold-500 mb-4" />
                <p className="text-navy-950/40 font-bold uppercase tracking-widest text-sm">Loading Heritage Sites...</p>
              </div>
            ) : attractions.map((site, i) => (
              <motion.div key={site.id} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-[3rem] border border-sand-100 overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative h-72 md:h-auto overflow-hidden">
                    <img src={site.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={site.title} />
                    <div className="absolute top-6 left-6">
                      <span className="bg-white/90 backdrop-blur px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-navy-950 shadow-sm">
                        {site.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-10 flex flex-col justify-center">
                    <h3 className="text-3xl font-serif font-bold text-navy-950 mb-4">{site.title}</h3>
                    <p className="text-navy-950/60 leading-relaxed mb-6 italic">{site.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="flex items-center gap-2 text-xs font-bold text-navy-950/40 uppercase tracking-widest">
                        <Clock className="w-4 h-4 text-gold-600" /> {site.timing}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-navy-950/40 uppercase tracking-widest">
                        <Info className="w-4 h-4 text-gold-600" /> Entry Fee Apply
                      </div>
                    </div>

                    <div className="space-y-2 mb-8">
                      {site.highlights.map((h: string) => (
                        <div key={h} className="flex items-center gap-2 text-sm text-navy-950/60">
                          <ShieldCheck className="w-4 h-4 text-green-600" /> {h}
                        </div>
                      ))}
                    </div>

                    <Button variant="outline" className="w-fit rounded-xl gap-2">
                      Get Directions <MapIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-28 space-y-8">
              {/* Map Teaser */}
              <div className="bg-navy-950 rounded-[2.5rem] p-8 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/20 rounded-full blur-3xl" />
                <h4 className="text-xl font-serif font-bold mb-4">Interactive Heritage Map</h4>
                <p className="text-white/60 text-sm mb-6">Download our offline-ready map featuring 100+ monuments and secret trails.</p>
                <Button className="w-full rounded-2xl bg-gold-500 text-navy-950 hover:bg-gold-400 font-bold">
                  View Map
                </Button>
              </div>

              {/* Travel Tips */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-sand-100 shadow-sm">
                <h4 className="text-xl font-serif font-bold text-navy-950 mb-6">Expert Travel Tips</h4>
                <div className="space-y-6">
                  {[
                    { icon: Sunrise, title: "Beat the Heat", text: "Start your explorations by 6:30 AM to avoid the midday sun." },
                    { icon: Camera, title: "Photography", text: "Most monuments allow cameras, but drones require special ASI permission." },
                    { icon: MapPin, title: "Local Transport", text: "Bicycles and mopeds are the best way to explore 'Hampi Island'." }
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 bg-sand-50 rounded-xl flex items-center justify-center shrink-0 border border-sand-100">
                        <tip.icon className="w-5 h-5 text-gold-600" />
                      </div>
                      <div>
                        <p className="font-bold text-navy-950 text-sm">{tip.title}</p>
                        <p className="text-xs text-navy-950/50 leading-relaxed mt-1">{tip.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gold-50 rounded-[2.5rem] p-8 border border-gold-100 text-center">
                <h4 className="text-xl font-serif font-bold text-navy-950 mb-2">Need a Private Guide?</h4>
                <p className="text-navy-950/60 text-sm mb-6">Our licensed heritage experts offer deep insights into the architecture and history.</p>
                <Link to="/experiences">
                  <Button className="w-full rounded-2xl shadow-gold">
                    Book a Heritage Tour
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
