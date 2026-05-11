import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";

const galleryCategories = ["All", "Resorts", "Interiors", "Dining", "Spa & Wellness", "Heritage", "Nature"] as const;
type Category = (typeof galleryCategories)[number];

interface GalleryImage {
  id: number;
  src: string;
  title: string;
  category: Category;
  span?: string; // grid span class
}

const galleryImages: GalleryImage[] = [
  {
    id: 1,
    src: "/images/hampi-1.png",
    title: "Evolve Back Kamalapura Palace — Grand Entrance",
    category: "Resorts",
    span: "col-span-2 row-span-2",
  },
  {
    id: 2,
    src: "/images/hampi-2.png",
    title: "Hampi's Boulders Resort — Riverside Cottages",
    category: "Resorts",
  },
  {
    id: 3,
    src: "/images/hampi-3.png",
    title: "Luxury Suite — Panoramic Ruin Views",
    category: "Interiors",
  },
  {
    id: 4,
    src: "/images/hampi-4.png",
    title: "Heritage Pool Villa — Private Retreat",
    category: "Resorts",
    span: "row-span-2",
  },
  {
    id: 5,
    src: "/images/hampi-5.png",
    title: "Infinity Pool Overlooking the Boulders",
    category: "Resorts",
  },
  {
    id: 6,
    src: "/images/hampi-6.png",
    title: "Royal Dining — Farm-to-Table Cuisine",
    category: "Dining",
    span: "col-span-2",
  },
  {
    id: 7,
    src: "/images/experience.png",
    title: "Ayurvedic Spa — Ancient Healing Traditions",
    category: "Spa & Wellness",
  },
  {
    id: 8,
    src: "/images/hampi-1.png",
    title: "Heritage Resort — Traditional Architecture",
    category: "Heritage",
  },
  {
    id: 9,
    src: "/images/hampi-2.png",
    title: "Ancient Bazaar — Living History",
    category: "Heritage",
    span: "col-span-2 row-span-2",
  },
  {
    id: 10,
    src: "/images/hampi-3.png",
    title: "Matanga Hill — Sunrise Vista",
    category: "Nature",
  },
  {
    id: 11,
    src: "/images/hampi-4.png",
    title: "Tungabhadra River — Golden Hour",
    category: "Nature",
  },
  {
    id: 12,
    src: "/images/hampi-5.png",
    title: "Presidential Suite — Opulent Interiors",
    category: "Interiors",
    span: "row-span-2",
  },
  {
    id: 13,
    src: "/images/hampi-6.png",
    title: "Boutique Resort — Poolside Lounge",
    category: "Resorts",
  },
  {
    id: 14,
    src: "/images/cta-bg.png",
    title: "Outdoor Dining Under the Stars",
    category: "Dining",
  },
  {
    id: 15,
    src: "/images/hero.png",
    title: "Hot Stone Massage — Wellness Sanctuary",
    category: "Spa & Wellness",
    span: "col-span-2",
  },
  {
    id: 16,
    src: "/images/auth-bg.png",
    title: "Vijayanagara Temple Ruins",
    category: "Heritage",
  },
];

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "All"
      ? galleryImages
      : galleryImages.filter((img) => img.category === activeCategory);

  const openLightbox = (idx: number) => setLightboxIndex(idx);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? filtered.length - 1 : lightboxIndex - 1);
  };

  const goNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === filtered.length - 1 ? 0 : lightboxIndex + 1);
  };

  return (
    <main className="min-h-screen bg-sand-50">
      {/* ── HERO ── */}
      <section className="relative pt-36 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gold-200/20 rounded-full blur-[150px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-gold-100/60 backdrop-blur-md border border-gold-200/60 rounded-full px-5 py-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-gold-700">
                Visual Stories
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl font-serif font-bold text-navy-950 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Our{" "}
            <span className="text-gold-600 italic">Gallery</span>
          </motion.h1>

          <motion.p
            className="text-lg text-navy-800/60 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            A visual journey through the luxury resorts, ancient heritage sites,
            and breathtaking landscapes that make Hampi a truly extraordinary
            destination.
          </motion.p>
        </div>
      </section>

      {/* ── FILTER TABS ── */}
      <section className="container mx-auto px-4 md:px-6 mb-12">
        <motion.div
          className="flex flex-wrap justify-center gap-2 md:gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {galleryCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-navy-950 text-white shadow-lg"
                  : "bg-white/70 text-navy-800/60 border border-sand-200/60 hover:border-gold-300 hover:text-gold-600 hover:bg-gold-50/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      </section>

      {/* ── MASONRY GRID ── */}
      <section className="container mx-auto px-4 md:px-6 pb-28">
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[280px] gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((img, idx) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer ${
                  img.span || ""
                }`}
                onClick={() => openLightbox(idx)}
              >
                <img
                  src={img.src}
                  alt={img.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.5s] ease-[0.16,1,0.3,1] group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Info */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="text-xs font-bold text-gold-400 tracking-wider uppercase mb-2 block">
                      {img.category}
                    </span>
                    <h3 className="text-white font-bold text-lg leading-snug">
                      {img.title}
                    </h3>
                  </div>
                </div>

                {/* Zoom icon */}
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                  <ZoomIn className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-navy-800/40 text-lg">
              No images found in this category.
            </p>
          </div>
        )}
      </section>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-navy-950/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-50"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Prev */}
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-50"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            {/* Next */}
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-50"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Image */}
            <motion.div
              key={filtered[lightboxIndex].id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="max-w-5xl max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filtered[lightboxIndex].src}
                alt={filtered[lightboxIndex].title}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
              <div className="text-center mt-4">
                <h3 className="text-white font-bold text-lg">
                  {filtered[lightboxIndex].title}
                </h3>
                <p className="text-white/40 text-sm mt-1">
                  {lightboxIndex + 1} / {filtered.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
