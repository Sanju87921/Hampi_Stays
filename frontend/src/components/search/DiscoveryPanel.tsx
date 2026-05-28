import React from 'react';
import { Compass, Flame, Map, Heart } from 'lucide-react';
import { trackFrontendEvent } from '../../utils/analytics';

const collections = [
  { id: 'trending', name: 'Trending in Hampi', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'heritage', name: 'Luxury Heritage Escapes', icon: Compass, color: 'text-[#C5A059]', bg: 'bg-[#C5A059]/10' },
  { id: 'riverside', name: 'Best Riverside Retreats', icon: Map, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'couple', name: 'Couple Getaways', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

export const DiscoveryPanel = ({ onSelectCollection }: { onSelectCollection: (id: string) => void }) => {
  return (
    <div className="py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-serif text-white mb-2">Curated Collections</h2>
          <p className="text-slate-400 text-sm">Discover handpicked experiences for your perfect stay</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {collections.map((collection) => (
          <div 
            key={collection.id}
            onClick={() => {
              trackFrontendEvent('discovery_collection_clicked', { collectionId: collection.id });
              onSelectCollection(collection.id);
            }}
            className="group cursor-pointer bg-white  border border-white/10 p-6 rounded-3xl hover:bg-white  hover:border-[#C5A059]/30 transition-all text-center flex flex-col items-center justify-center backdrop-blur-md"
          >
            <div className={`p-4 rounded-full ${collection.bg} ${collection.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <collection.icon className="w-8 h-8" />
            </div>
            <h3 className="text-white font-medium group-hover:text-[#C5A059] transition-colors">{collection.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};
