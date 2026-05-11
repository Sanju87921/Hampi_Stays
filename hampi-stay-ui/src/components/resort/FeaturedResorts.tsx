import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MapPin, Heart, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export function FeaturedResorts() {
  const [resorts, setResorts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch("/api/resorts/featured");
        const data = await response.json();
        if (Array.isArray(data)) {
          setResorts(data);
        } else {
          setResorts([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fId) => fId !== id) : [...prev, id]
    );
  };

  if (isLoading) return (
    <div className="py-20 flex justify-center bg-sand-50">
      <Loader2 className="w-10 h-10 animate-spin text-gold-600" />
    </div>
  );

  if (resorts.length === 0) return null;

  return (
    <section className="py-32 md:py-48 bg-sand-50 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-64 h-64 md:w-96 md:h-96 bg-gold-200/20 rounded-full blur-[100px] opacity-60 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 md:mb-16 gap-6 md:gap-8">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-gold-600 font-bold tracking-[0.2em] uppercase text-xs sm:text-sm mb-4 block"
            >
              Exclusive Properties
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-7xl font-serif text-navy-950 font-bold mb-6 leading-[1.1]"
            >
              Handpicked Sanctuaries
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-editorial ml-0"
            >
              Discover our curated selection of luxury properties that offer the
              perfect blend of modern comfort and profound heritage charm.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex-shrink-0"
          >
            <Link to="/resorts">
              <Button
                variant="outline"
                className="group flex items-center gap-3 border-navy-200/50 text-navy-950 hover:border-gold-500 hover:bg-gold-500 hover:text-white transition-all duration-500 px-8 py-4 rounded-full text-xs tracking-widest uppercase font-bold shadow-sm hover:shadow-gold"
              >
                View Collection
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {resorts.map((resort, index) => {
            const isFav = favorites.includes(resort.id);
            return (
              <motion.div
                key={resort.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 1,
                  delay: index * 0.15,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative aspect-[3/4] overflow-hidden bg-navy-950 cursor-pointer rounded-[28px] shadow-luxury hover:shadow-luxury-hover transition-all duration-700 hover:-translate-y-2"
              >
                {/* Image */}
                <img
                  src={resort.images?.[0] || "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=75&w=800"}
                  alt={resort.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-[0.16,1,0.3,1] group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                
                {/* Cinematic Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                {/* Top Actions */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                  <span className="bg-white/15 backdrop-blur-md border border-white/20 px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-[0.2em] shadow-sm rounded-full">
                    Signature
                  </span>
                  <button
                    onClick={(e) => toggleFavorite(e, resort.id)}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors shadow-sm group/btn"
                    aria-label="Toggle favourite"
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 transition-all duration-300",
                        isFav
                          ? "fill-gold-500 text-gold-500 scale-110"
                          : "text-white group-hover/btn:scale-110"
                      )}
                    />
                  </button>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 flex flex-col justify-end z-20 transform transition-transform duration-700 ease-[0.16,1,0.3,1]">
                  <div className="flex items-center gap-2 text-gold-300 mb-3 opacity-90 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-bold tracking-widest uppercase">
                      {resort.locationArea}, Hampi
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold font-serif text-white mb-4 leading-snug transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                    {resort.name}
                  </h3>

                  <div className="flex items-center gap-4 mb-6 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
                      <span className="text-sm font-bold text-white">
                        4.9
                      </span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-sm text-white/70 font-medium">
                      Starting ₹{resort.pricePerNight}/night
                    </span>
                  </div>

                  {/* Hidden CTA that slides up */}
                  <div className="overflow-hidden">
                    <div className="transform translate-y-[120%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] delay-200">
                      <Link to={`/resorts/${resort.slug}`} className="block w-full">
                        <Button
                          variant="primary"
                          className="w-full bg-navy-950 text-white hover:bg-gold-500 hover:text-navy-950 rounded-full border border-white/10 py-5 uppercase tracking-widest text-xs font-bold transition-all duration-500 shadow-luxury hover:shadow-gold"
                        >
                          Explore Sanctuary
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

