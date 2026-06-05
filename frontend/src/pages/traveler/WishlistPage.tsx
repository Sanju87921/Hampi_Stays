import { motion } from "framer-motion";
import { Heart, MapPin, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { Button } from "../../components/ui/Button";

export function WishlistPage() {
  const { wishlist, isLoading, toggleWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-sand-50/50 pt-28 pb-12">
      <div className="container mx-auto px-4">
        <header className="mb-10 max-w-4xl">
          <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">My Wishlist</h1>
          <p className="text-navy-950/50">Your hand-picked collection of Hampi escapes.</p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlist.map((resort, i) => (
              <motion.div
                key={resort.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[2.5rem] border border-sand-100 overflow-hidden shadow-sm hover:shadow-luxury transition-all group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={resort.images?.[0] || "https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=800"}
                    alt={resort.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                  <button
                    onClick={() => toggleWishlist(resort.id)}
                    className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-500 shadow-lg hover:bg-red-50 hover:text-red-7000 hover:text-white transition-all"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-2 text-gold-600 text-xs font-bold uppercase tracking-widest mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {resort.location?.area || (resort as any).locationArea || "Hampi"}
                  </div>
                  <h3 className="text-2xl font-bold font-serif text-navy-950 mb-2">{resort.name}</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
                      <span className="text-sm font-bold text-navy-950">{resort.rating ?? "—"}</span>
                    </div>
                    <span className="text-xs text-navy-950/40 font-medium">({resort.reviewCount ?? 0} reviews)</span>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-sand-50">
                    <div>
                      <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-1">From</p>
                      <p className="text-xl font-bold text-navy-950">
                        ₹{resort.pricePerNight ? resort.pricePerNight.toLocaleString() : "—"}
                      </p>
                    </div>
                    <Link to={`/resorts/${resort.slug}`}>
                      <Button variant="outline" className="rounded-xl px-6 group/btn">
                        View Escape
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-sand-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Heart className="w-10 h-10 text-red-200" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-navy-950 mb-4">Your wishlist is empty</h2>
            <p className="text-navy-950/60 mb-10">Start saving your favorite Hampi resorts and plan your perfect getaway.</p>
            <Link to="/resorts">
              <Button size="lg" className="rounded-2xl px-12 shadow-gold">Explore Resorts</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
