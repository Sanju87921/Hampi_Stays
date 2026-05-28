import React, { useState } from 'react';
import { PremiumSearchInterface } from '../components/search/PremiumSearchInterface';
import { DiscoveryPanel } from '../components/search/DiscoveryPanel';

export const DiscoveryPage = () => {
  const [activeCollection, setActiveCollection] = useState<string | null>(null);

  return (
    <div className="bg-[#0A1128] min-h-screen">
      {/* Hero Header */}
      <div className="pt-32 pb-12 px-4 md:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6 leading-tight">
          Find your <span className="text-[#C5A059] italic">sanctuary</span> in Hampi
        </h1>
        <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto">
          Explore curated heritage stays, riverside luxury, and unforgettable local experiences.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <DiscoveryPanel onSelectCollection={(id) => setActiveCollection(id)} />
      </div>

      {/* The main Algolia Search component */}
      <PremiumSearchInterface />
      
    </div>
  );
};
