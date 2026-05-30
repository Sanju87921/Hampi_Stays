// ============================================================
// ResortCard — Luxury resort card for listing page
// ============================================================

import React, { useState, memo } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Star, MapPin, Heart, Check } from "lucide-react";
import { cn } from "../../utils/cn";
import { PremiumIcon } from "../ui/PremiumIcon";
import type { Resort } from "../../types/resort";
// useAuth import removed
import { useWishlist } from "../../context/WishlistContext";
import { useProtectedAction } from "../../hooks/useProtectedAction";
// apiClient import removed
import { optimizeImage } from "../../utils/image";

interface ResortCardProps {
  resort: Resort;
  index?: number;
  isInCompare?: boolean;
  onCompareToggle?: (resort: Resort) => void;
  compareDisabled?: boolean;
}

const TYPE_LABELS: Record<Resort["type"], string> = {
  luxury: "Luxury",
  boutique: "Boutique",
  eco: "Eco-Stay",
  heritage: "Heritage",
  budget: "Budget",
};

const TYPE_COLORS: Record<Resort["type"], string> = {
  luxury: "bg-amber-50 text-amber-700 border-amber-200",
  boutique: "bg-purple-50 text-purple-700 border-purple-200",
  eco: "bg-green-50 text-green-700 border-green-200",
  heritage: "bg-orange-50 text-orange-700 border-orange-200",
  budget: "bg-blue-50 text-blue-700 border-blue-200",
};

export const ResortCard = memo(function ResortCard({
  resort,
  index = 0,
  isInCompare = false,
  onCompareToggle,
  compareDisabled = false,
}: ResortCardProps) {
  const { isFavorite, toggleWishlist } = useWishlist();
  const { protect } = useProtectedAction();
  const [imgError, setImgError] = useState(false);

  const isFav = isFavorite(resort.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    protect(
      () => toggleWishlist(resort.id),
      { message: "Save to your collection", view: "register" }
    );
  };

  // ── 3D TILT LOGIC ──
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [7, -7]), { damping: 25, stiffness: 200 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-7, 7]), { damping: 25, stiffness: 200 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    x.set(mouseX / width);
    y.set(mouseY / height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <div style={{ perspective: "1000px" }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: typeof window !== 'undefined' && window.matchMedia("(hover: hover)").matches ? rotateX : 0,
          rotateY: typeof window !== 'undefined' && window.matchMedia("(hover: hover)").matches ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className="group bg-white  rounded-2xl overflow-hidden shadow-sm hover:shadow-luxury transition-all duration-500 border border-sand-100  flex flex-col cursor-default"
      >
        {/* Image */}
        <Link to={`/resorts/${resort.slug}`} className="relative aspect-[4/3] overflow-hidden block bg-sand-100" style={{ transform: "translateZ(30px)" }}>
          <img
            src={optimizeImage(imgError ? "/images/hampi-1.png" : resort.images[0], 600)}
            alt={resort.name}
            loading="lazy"
            width="600"
            height="450"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-1000 ease-[0.16,1,0.3,1] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 max-w-[80%]" style={{ transform: "translateZ(50px)" }}>
            {resort.isFeatured && (
              <span className="bg-gold-600 text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                Featured
              </span>
            )}
            <span className={cn("px-3 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider", TYPE_COLORS[resort.type])}>
              {TYPE_LABELS[resort.type]}
            </span>
            {(resort.categories || (resort.category ? [resort.category] : [])).map((cat) => (
              <span key={cat} className="bg-navy-950/85 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-xs">
                {cat}
              </span>
            ))}
          </div>

          {/* Favourite */}
          <button
            type="button"
            aria-label="Add to favourites"
            onClick={handleToggleWishlist}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white  backdrop-blur-md flex items-center justify-center hover:bg-white  transition-colors shadow-sm z-20"
            style={{ transform: "translateZ(50px)" }}
          >
            <Heart className={cn("w-5 h-5 transition-all duration-300", isFav ? "fill-gold-500 text-gold-500 scale-110" : "text-white")} />
          </button>

          {/* Rating badge on hover */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300" style={{ transform: "translateZ(40px)" }}>
            <PremiumIcon icon={Star} variant="gold" size="sm" animate={false} />
            <span className="text-sm font-bold text-white drop-shadow-md">{resort.rating}</span>
            <span className="text-xs text-white/60 font-medium">({resort.reviewCount})</span>
          </div>
        </Link>

        {/* Content */}
        <div className="p-6 flex-grow flex flex-col justify-between" style={{ transform: "translateZ(20px)" }}>
          <div>
            <div className="flex items-center gap-1.5 text-navy-950   mb-2">
              <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0" />
              <span className="text-sm font-medium tracking-wide">
                {resort.location?.area || resort.locationArea || "Hampi"}, Hampi
              </span>
            </div>

            <Link to={`/resorts/${resort.slug}`}>
              <h3 className="text-xl font-bold font-serif text-navy-950  group-hover:text-gold-600 transition-colors duration-300 mb-4 leading-snug">
                {resort.name}
              </h3>
            </Link>

            <div className="flex flex-wrap gap-2 mb-5">
              {(resort.amenities || []).slice(0, 3).map((a) => (
                <span key={a} className="px-3 py-1 bg-sand-50  text-navy-950   text-xs font-semibold rounded-lg border border-sand-100 ">
                  {a}
                </span>
              ))}
              {(resort.amenities || []).length > 3 && (
                <span className="px-3 py-1 bg-sand-50  text-navy-950   text-xs font-semibold rounded-lg border border-sand-100 ">
                  +{(resort.amenities || []).length - 3} more
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end justify-between pt-5 border-t border-sand-100 ">
            <div>
              <span className="block text-[11px] text-navy-800/40 uppercase tracking-widest font-bold mb-0.5">From</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-serif font-bold text-navy-950 ">
                  ₹{resort.pricePerNight.toLocaleString("en-IN")}
                </span>
                <span className="text-sm font-medium text-navy-950  ">/night</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Compare toggle */}
              {onCompareToggle && (
                <button
                  type="button"
                  onClick={() => onCompareToggle(resort)}
                  disabled={compareDisabled && !isInCompare}
                  title={isInCompare ? "Remove from compare" : "Add to compare"}
                  className={cn(
                    "text-xs font-bold px-3 py-2 rounded-xl border transition-all duration-200",
                    isInCompare
                      ? "bg-navy-800 text-white border-navy-800"
                      : "border-sand-300 text-navy-950   hover:border-navy-600 hover:text-navy-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {isInCompare ? (
                    <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Added</span>
                  ) : "Compare"}
                </button>
              )}

              <Link
                to={`/resorts/${resort.slug}`}
                className="text-sm font-bold text-navy-800 hover:text-white px-5 py-2 rounded-xl border border-navy-200 hover:bg-navy-900 hover:border-navy-900 transition-all duration-300"
              >
                Explore
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

