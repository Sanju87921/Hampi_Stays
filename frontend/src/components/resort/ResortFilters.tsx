import { X, SlidersHorizontal, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FilterState, Amenity, ResortType } from "../../types/resort";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../utils/apiClient";

interface ResortFiltersProps {
 filters: FilterState;
 onChange: (filters: FilterState) => void;
 maxPrice: number;
 isOpen?: boolean;
 onClose?: () => void;
}

const AMENITY_OPTIONS: Amenity[] = [
 "Pool", "Spa", "WiFi", "Restaurant", "Bar", "Yoga",
 "River View", "Heritage View", "Guided Tours", "Cycling",
 "Organic Food", "Campfire", "Air Conditioning", "Pet Friendly",
 "Airport Transfer", "Breakfast Included", "Laundry", "Library"
];

const TYPE_OPTIONS: ResortType[] = ["luxury", "eco", "heritage", "budget", "boutique"];

export function ResortFilters({ filters, onChange, maxPrice, isOpen, onClose }: ResortFiltersProps) {
 const { data: fetchedCategories } = useQuery({
 queryKey: ["resort-categories"],
 queryFn: async () => {
 try {
 const res = await apiClient.get<string[]>("/resorts/categories");
 return res;
 } catch (e) {
 return [];
 }
 },
 staleTime: 60000,
 });

 const categoriesList = fetchedCategories && fetchedCategories.length > 0
 ? Array.from(new Set([...["Heritage", "Nature", "Riverside", "Temple View", "Boutique"], ...fetchedCategories]))
 : ["Heritage", "Nature", "Riverside", "Temple View", "Boutique"];

 const content = (
 <div className="bg-white rounded-[2.5rem] border border-sand-200 p-8 shadow-sm flex flex-col h-full lg:h-auto overflow-hidden">
 <div className="flex items-center justify-between mb-8 flex-shrink-0">
 <h3 className="text-xl font-serif font-bold text-navy-950 flex items-center gap-2">
 <SlidersHorizontal className="w-5 h-5 text-gold-600" />
 Filter Sanctuaries
 </h3>
 {onClose && (
 <button onClick={onClose} className="lg:hidden p-2 hover:bg-sand-50 :bg-sand-100 rounded-full transition-colors">
 <X className="w-5 h-5 text-navy-950 " />
 </button>
 )}
 </div>

 <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-10">
 {/* ... rest of content same ... */}
 {/* Price Range */}
 <section>
 <h4 className="text-xs font-bold text-navy-950 uppercase tracking-widest mb-4">
 Nightly Rate (₹)
 </h4>
 <div className="space-y-4">
 <div className="flex justify-between text-sm font-bold text-navy-950 ">
 <span>₹0</span>
 <span>₹{filters.maxPrice.toLocaleString()}</span>
 </div>
 <input
 type="range"
 min={0}
 max={maxPrice || 60000}
 step={1000}
 value={filters.maxPrice}
 onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
 className="w-full h-1.5 bg-sand-100 rounded-lg appearance-none cursor-pointer accent-gold-600"
 />
 </div>
 </section>

 {/* Resort Types */}
 <section>
 <h4 className="text-xs font-bold text-navy-950 uppercase tracking-widest mb-4">
 Collection Type
 </h4>
 <div className="flex flex-wrap gap-2">
 {TYPE_OPTIONS.map((type) => (
 <button
 key={type}
 onClick={() => {
 const types = filters.types.includes(type)
 ? filters.types.filter((t) => t !== type)
 : [...filters.types, type];
 onChange({ ...filters, types });
 }}
 className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
 filters.types.includes(type)
 ? "bg-navy-950 text-white border-navy-950 shadow-md"
 : "bg-white text-navy-950 border-sand-200 hover:border-gold-400 hover:text-navy-950 "
 }`}
 >
 {type}
 </button>
 ))}
 </div>
 </section>

 {/* Resort Categories */}
 <section>
 <h4 className="text-xs font-bold text-navy-950 uppercase tracking-widest mb-4">
 Resort Categories
 </h4>
 <div className="flex flex-wrap gap-2">
 {categoriesList.map((cat) => (
 <button
 key={cat}
 type="button"
 onClick={() => {
 const categories = (filters.categories || []).includes(cat)
 ? (filters.categories || []).filter((c) => c !== cat)
 : [...(filters.categories || []), cat];
 onChange({ ...filters, categories });
 }}
 className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
 (filters.categories || []).includes(cat)
 ? "bg-navy-950 text-white border-navy-950 shadow-md"
 : "bg-white text-navy-950 border-sand-200 hover:border-gold-400 hover:text-navy-950 "
 }`}
 >
 {cat}
 </button>
 ))}
 </div>
 </section>

 {/* Amenities */}
 <section>
 <h4 className="text-xs font-bold text-navy-950 uppercase tracking-widest mb-4">
 Amenities & Services
 </h4>
 <div className="grid grid-cols-1 gap-3">
 {AMENITY_OPTIONS.map((amenity) => (
 <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
 <div className="relative flex items-center justify-center">
 <input
 type="checkbox"
 className="peer sr-only"
 checked={filters.amenities.includes(amenity)}
 onChange={() => {
 const amenities = filters.amenities.includes(amenity)
 ? filters.amenities.filter((a) => a !== amenity)
 : [...filters.amenities, amenity];
 onChange({ ...filters, amenities });
 }}
 />
 <div className="w-5 h-5 border-2 border-sand-200 rounded-md transition-all peer-checked:border-gold-600 peer-checked:bg-gold-600" />
 <X className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity rotate-45" />
 </div>
 <span className="text-sm font-medium text-navy-950 group-hover:text-navy-950 transition-colors">
 {amenity}
 </span>
 </label>
 ))}
 </div>
 </section>

 {/* Minimum Rating */}
 <section>
 <h4 className="text-xs font-bold text-navy-950 uppercase tracking-widest mb-4">
 Guest Rating
 </h4>
 <div className="flex gap-2">
 {[4, 3, 2, 1].map((rating) => (
 <button
 key={rating}
 onClick={() => onChange({ ...filters, minRating: rating })}
 className={`flex-1 flex flex-col items-center justify-center py-3 rounded-2xl border transition-all ${
 filters.minRating === rating
 ? "bg-gold-50 border-gold-400 text-gold-700 shadow-sm"
 : "bg-white border-sand-200 text-navy-950 hover:border-gold-200"
 }`}
 >
 <div className="flex mb-1">
 {[...Array(rating)].map((_, i) => (
 <Star key={i} className="w-3 h-3 fill-current" />
 ))}
 </div>
 <span className="text-[10px] font-bold uppercase">{rating}+</span>
 </button>
 ))}
 </div>
 </section>
 </div>

 {/* Footer Actions */}
 <div className="mt-8 pt-8 border-t border-sand-100 flex-shrink-0">
 <button
 onClick={() => onChange({ ...filters, amenities: [], types: [], categories: [], minRating: 0, maxPrice: maxPrice || 60000 })}
 className="w-full py-4 text-sm font-bold text-navy-950 hover:text-red-600 transition-colors uppercase tracking-widest"
 >
 Reset All Filters
 </button>
 </div>
 </div>
 );

 if (onClose) {
 // Mobile Version (Bottom Sheet)
 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-[100] lg:hidden">
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
 />
 <motion.div
 initial={{ y: "100%" }}
 animate={{ y: 0 }}
 exit={{ y: "100%" }}
 transition={{ type: "spring", damping: 25, stiffness: 200 }}
 className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
 >
 {/* Grab Handle */}
 <div className="w-full flex justify-center p-4">
 <div className="w-12 h-1.5 bg-sand-200 rounded-full" />
 </div>
 <div className="flex-grow overflow-hidden">
 {content}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
 }

 // Desktop Version
 return (
 <div className="hidden lg:block">
 {content}
 </div>
 );
}
