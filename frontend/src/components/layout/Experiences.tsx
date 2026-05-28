import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, IndianRupee } from "lucide-react";
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
          // Show only the latest 3 experiences on landing page
          setExperiences(data.slice(0, 3));
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
      image: "/images/experience.png"
    },
    {
      id: "f2",
      title: "Archaeology Deep Dive",
      durationHours: 3,
      description: "Join a private tour led by a field archaeologist to explore hidden royal enclosures.",
      price: 3500,
      meetingPoint: "Vittala Temple Gate",
      image: "/images/hampi-4.png"
    },
    {
      id: "f3",
      title: "Boulder Sunrise Trek",
      durationHours: 2,
      description: "Trek to the summit of Matanga Hill for a breathtaking 360° dawn panorama.",
      price: 1800,
      meetingPoint: "Hampi Island",
      image: "/images/hampi-5.png"
    }
  ];

  const displayExperiences = experiences.length > 0 ? experiences : fallbackExperiences;

  return (
    <section className="py-32 md:py-48 bg-sand-100 dark:bg-zinc-800/50 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
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
            className="text-4xl md:text-5xl lg:text-7xl font-serif text-navy-950 dark:text-white font-bold mb-8 leading-[1.1]"
          >
            Beyond Accommodation
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-editorial"
          >
            Signature experiences curated by local experts — designed 
            to grant you exclusive access to the heart of the Vijayanagara empire.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {displayExperiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-luxury transition-all duration-700 hover:-translate-y-1.5 h-[500px]"
            >
              <img
                src={imgErrors[exp.id] ? "/images/hampi-3.png" : (exp.image || "/images/hampi-3.png")}
                alt={exp.title}
                loading="lazy"
                onError={() => setImgErrors(prev => ({ ...prev, [exp.id]: true }))}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-[0.16,1,0.3,1] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/40 to-transparent" />

              {/* Badges */}
              <div className="absolute top-8 left-8 z-20 flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 group/badge">
                  <PremiumIcon icon={Clock} variant="glass" size="sm" animate={false} />
                  <span className="text-white font-bold tracking-widest text-[10px] uppercase">{exp.durationHours} Hours</span>
                </span>
              </div>

              {/* Content overlay */}
              <div className="absolute inset-0 p-10 flex flex-col justify-end z-20">
                <h3 className="text-3xl font-serif font-bold text-white mb-4 leading-tight group-hover:text-gold-400 transition-colors duration-500">
                  {exp.title}
                </h3>

                <p className="text-sand-100/70 font-light leading-relaxed mb-8 opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700 ease-[0.16,1,0.3,1] line-clamp-3">
                  {exp.description}
                </p>

                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-700 delay-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Price</span>
                    <span className="text-xl font-bold text-white flex items-center gap-0.5"><IndianRupee className="w-4 h-4" />{exp.price}</span>
                  </div>
                  <Link to="/experiences">
                    <Button size="sm" className="rounded-xl bg-white dark:bg-zinc-900 text-navy-950 dark:text-white hover:bg-gold-500 hover:text-navy-950 dark:text-white border-none px-6">
                      Book Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link to="/experiences">
            <Button variant="outline" className="rounded-2xl px-12 h-14 border-navy-950 text-navy-950 dark:text-white hover:bg-navy-950 hover:text-white transition-all font-bold">
              View All Signature Tours
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

