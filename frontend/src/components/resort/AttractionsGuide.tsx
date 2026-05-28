import { ArrowRight } from "lucide-react";
import type { NearbyAttraction } from "../../types/resort";

interface AttractionsGuideProps {
  attractions: NearbyAttraction[];
}

export function AttractionsGuide({ attractions }: AttractionsGuideProps) {
  if (!attractions || attractions.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold font-serif text-navy-950 dark:text-white mb-6">Explore the Neighborhood</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attractions.map((place) => (
          <div 
            key={place.name}
            className="group flex items-center gap-5 p-5 bg-white dark:bg-zinc-900 rounded-3xl border border-sand-100 dark:border-zinc-800/50 hover:border-gold-300 transition-all hover:shadow-md"
          >
            <div className="w-20 h-20 rounded-2xl bg-sand-100 dark:bg-zinc-800/50 flex-shrink-0 overflow-hidden">
              <img 
                src={place.imageUrl || "/images/hampi-1.png"} 
                alt={place.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/hampi-1.png";
                }}
              />
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-navy-950 dark:text-white group-hover:text-gold-600 transition-colors">{place.name}</h4>
                <span className="text-[10px] font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full border border-gold-100">
                  {place.distanceKm}
                </span>
              </div>
              <p className="text-xs text-navy-950 dark:text-white/50 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                Discover the architectural marvels of the Vijayanagara Empire located just a short journey from your sanctuary.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-navy-950 dark:text-white/20 dark:text-zinc-700 group-hover:text-gold-600 transition-all group-hover:translate-x-1" />
          </div>
        ))}
      </div>
      <div className="mt-8 p-8 bg-navy-950 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10">
          <h4 className="text-xl font-serif font-bold mb-2">Unlock Hampi's Secrets</h4>
          <p className="text-white/60 text-sm max-w-md">Our certified local experts can bring these ancient stones to life with historical storytelling.</p>
        </div>
        <a href="/guide" className="relative z-10 whitespace-nowrap bg-gold-500 hover:bg-gold-400 text-navy-950 dark:text-white px-8 py-3 rounded-xl font-bold transition-all shadow-gold group-hover:scale-105">
          Find an Expert
        </a>
      </div>
    </section>
  );
}
