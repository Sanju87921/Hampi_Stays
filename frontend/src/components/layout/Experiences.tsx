import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, IndianRupee, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { PremiumIcon } from "../ui/PremiumIcon";
import { apiClient } from "../../utils/apiClient";

export function Experiences() {
  const [experiences, setExperiences] = useState<any[]>([]);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const data = await apiClient.get<any[]>('/experiences');
        if (Array.isArray(data)) {
          const activePackages = data.filter(p => p.isActive !== false);
          activePackages.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setExperiences(activePackages);
        } else {
          console.warn("API did not return an array:", data);
        }
      } catch (err) {
        console.error("Failed to fetch experiences", err);
      }
    };
    fetchExperiences();
  }, []);

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Fallback data if no real experiences exist yet
  const fallbackExperiences = [
    {
      id: "f1",
      title: "Heritage Cycle Tour",
      durationHours: 6,
      description: "Pedal through the ancient bazaar and forgotten village paths that no car can reach.",
      price: 2500,
      meetingPoint: "Hampi Bazaar",
      images: ["/images/experience.png"]
    },
    {
      id: "f2",
      title: "Archaeology Deep Dive",
      durationHours: 3,
      description: "Join a private tour led by a field archaeologist to explore hidden royal enclosures.",
      price: 3500,
      meetingPoint: "Vittala Temple Gate",
      images: ["/images/hampi-4.png"]
    },
    {
      id: "f3",
      title: "Boulder Sunrise Trek",
      durationHours: 2,
      description: "Trek to the summit of Matanga Hill for a breathtaking 360° dawn panorama.",
      price: 1800,
      meetingPoint: "Hampi Island",
      images: ["/images/hampi-5.png"]
    }
  ];

  const displayExperiences = experiences.length > 0 ? experiences : fallbackExperiences;

  return (
    <section className="py-24 md:py-32 bg-sand-100 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gold-600 font-bold tracking-[0.2em] uppercase text-xs sm:text-sm mb-6 block"
          >
            Immersive Activities
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif text-navy-950 font-bold mb-6 leading-[1.1]"
          >
            Curated Hampi Experiences
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-editorial"
          >
            Handcrafted tours, heritage journeys and unforgettable local experiences.
          </motion.p>
        </div>

        {/* Cards Carousel/Grid */}
        <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8 snap-x snap-mandatory no-scrollbar">
          {displayExperiences.map((exp, index) => {
            const imageUrl = exp.images?.[0] || exp.image || "/images/hampi-3.png";
            return (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex-shrink-0 w-[85vw] sm:w-[60vw] md:w-auto snap-start rounded-2xl overflow-hidden shadow-md hover:shadow-luxury transition-all duration-700 hover:-translate-y-1.5 h-[480px]"
              >
                <img
                  src={imgErrors[exp.id] ? "/images/hampi-3.png" : imageUrl}
                  alt={exp.title}
                  loading="lazy"
                  onError={() => setImgErrors(prev => ({ ...prev, [exp.id]: true }))}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-[0.16,1,0.3,1] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent" />

                {/* Badges */}
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                  <span className="inline-flex items-center gap-2 bg-navy-950/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-gold-400" />
                    <span className="text-white font-bold tracking-widest text-[10px] uppercase">{exp.durationHours} Hours</span>
                  </span>
                </div>

                {/* Content overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col z-20 bg-gradient-to-t from-navy-950 pt-12">
                  <h3 className="text-2xl font-serif font-bold text-white mb-2 leading-tight group-hover:text-gold-400 transition-colors duration-500 line-clamp-2">
                    {exp.title}
                  </h3>

                  <p className="text-sand-100/80 font-light text-sm mb-4 line-clamp-2">
                    {exp.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Starting from</span>
                      <span className="text-lg font-bold text-white flex items-center"><IndianRupee className="w-3.5 h-3.5 mr-0.5" />{exp.price}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-[0.16,1,0.3,1]">
                    <Link to={`/experiences/${exp.id}`} className="block">
                      <Button size="sm" variant="outline" className="w-full rounded-xl border-white/20 text-white hover:bg-white/10 h-10 px-0">
                        Details
                      </Button>
                    </Link>
                    <Link to={`/checkout?experience=${exp.id}`} className="block">
                      <Button size="sm" className="w-full rounded-xl bg-gold-500 text-navy-950 hover:bg-gold-400 border-none h-10 px-0">
                        Book Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <Link to="/experiences">
            <Button variant="outline" className="rounded-2xl px-10 h-12 border-navy-950 text-navy-950 hover:bg-navy-950 hover:text-white transition-all font-bold">
              View All Tour Packages
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

