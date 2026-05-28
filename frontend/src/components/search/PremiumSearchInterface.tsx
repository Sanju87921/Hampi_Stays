import React from 'react';
import { InstantSearch, SearchBox, Hits, RefinementList, Pagination, Configure } from 'react-instantsearch';
import { getSearchClient } from '../../utils/search/algoliaClient';
import { trackFrontendEvent } from '../../utils/analytics';
import { Search, MapPin, Star, Filter } from 'lucide-react';

const HitComponent = ({ hit }: any) => {
  return (
    <div 
      className="bg-white  border border-[#C5A059]/20 rounded-2xl overflow-hidden backdrop-blur-md hover:bg-white  transition-all cursor-pointer group"
      onClick={() => {
        trackFrontendEvent('search_result_clicked', { resortId: hit.objectID, name: hit.name });
        window.location.href = `/resorts/${hit.objectID}`;
      }}
    >
      <div className="h-48 bg-[#0A1128] relative overflow-hidden">
        {hit.images?.[0] ? (
          <img src={hit.images[0]} alt={hit.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
        )}
        {hit.isSponsored && (
          <div className="absolute top-3 left-3 bg-[#C5A059] text-[#0A1128] text-xs font-bold px-2 py-1 rounded-md">
            Sponsored
          </div>
        )}
        {hit.isFeatured && !hit.isSponsored && (
          <div className="absolute top-3 left-3 bg-white  text-[#0A1128] text-xs font-bold px-2 py-1 rounded-md">
            Featured
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-serif text-white group-hover:text-[#C5A059] transition-colors">{hit.name}</h3>
          <div className="flex items-center gap-1 text-[#C5A059] bg-[#C5A059]/10 px-2 py-1 rounded-full text-xs font-medium">
            <Star className="w-3 h-3 fill-current" />
            {hit.rating || 'New'}
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-sm mb-4">
          <MapPin className="w-4 h-4" />
          {hit.location}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {hit.amenities?.slice(0, 3).map((amenity: string) => (
            <span key={amenity} className="text-xs text-white/70 bg-white  border border-white/10 px-2 py-1 rounded-md">
              {amenity}
            </span>
          ))}
          {hit.amenities?.length > 3 && (
            <span className="text-xs text-white/50 px-1 py-1">+{hit.amenities.length - 3} more</span>
          )}
        </div>
      </div>
    </div>
  );
};

export const PremiumSearchInterface = () => {
  const searchClient = getSearchClient();

  return (
    <div className="min-h-screen bg-[#0A1128] pt-24 pb-12 px-4 md:px-8">
      <InstantSearch searchClient={searchClient} indexName="resorts">
        <Configure hitsPerPage={12} />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
          
          {/* Advanced Filtering Sidebar */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="bg-white  border border-[#C5A059]/20 rounded-3xl p-6 backdrop-blur-md sticky top-24">
              <h2 className="text-white font-serif text-xl mb-6 flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#C5A059]" />
                Refine Search
              </h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-[#C5A059] text-sm font-medium uppercase tracking-wider mb-4">Category</h3>
                  <RefinementList 
                    attribute="category" 
                    classNames={{
                      list: 'space-y-2',
                      label: 'flex items-center gap-3 text-slate-300 cursor-pointer hover:text-white transition-colors',
                      checkbox: 'w-4 h-4 rounded border-white/20 bg-transparent text-[#C5A059] focus:ring-[#C5A059] focus:ring-offset-[#0A1128]',
                      count: 'ml-auto text-xs bg-white  px-2 py-0.5 rounded-full text-white/50'
                    }}
                  />
                </div>

                <div>
                  <h3 className="text-[#C5A059] text-sm font-medium uppercase tracking-wider mb-4">Amenities</h3>
                  <RefinementList 
                    attribute="amenities" 
                    limit={5}
                    showMore={true}
                    classNames={{
                      list: 'space-y-2',
                      label: 'flex items-center gap-3 text-slate-300 cursor-pointer hover:text-white transition-colors',
                      checkbox: 'w-4 h-4 rounded border-white/20 bg-transparent text-[#C5A059] focus:ring-[#C5A059] focus:ring-offset-[#0A1128]',
                      count: 'ml-auto text-xs bg-white  px-2 py-0.5 rounded-full text-white/50',
                      showMore: 'mt-3 text-sm text-[#C5A059] hover:text-white transition-colors'
                    }}
                  />
                </div>
                
                <div>
                  <h3 className="text-[#C5A059] text-sm font-medium uppercase tracking-wider mb-4">Price Range</h3>
                  <RefinementList 
                    attribute="priceRange" 
                    classNames={{
                      list: 'space-y-2',
                      label: 'flex items-center gap-3 text-slate-300 cursor-pointer hover:text-white transition-colors',
                      checkbox: 'w-4 h-4 rounded border-white/20 bg-transparent text-[#C5A059] focus:ring-[#C5A059] focus:ring-offset-[#0A1128]',
                      count: 'ml-auto text-xs bg-white  px-2 py-0.5 rounded-full text-white/50'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Area */}
          <div className="flex-1">
            <div className="relative mb-8">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C5A059]" />
              <SearchBox 
                translations={{ placeholder: 'Search for luxury stays, riverside cottages, or heritage experiences...' }}
                classNames={{
                  root: 'w-full',
                  form: 'relative flex items-center',
                  input: 'w-full bg-white  border border-[#C5A059]/30 rounded-full py-4 pl-14 pr-6 text-white placeholder-slate-400 focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all text-lg',
                  submit: 'hidden',
                  reset: 'absolute right-6 text-slate-400 hover:text-white transition-colors'
                }}
              />
            </div>

            <div className="mb-6 flex justify-between items-end">
              <h2 className="text-2xl font-serif text-white">Discovery Results</h2>
            </div>

            <Hits 
              hitComponent={HitComponent} 
              classNames={{
                list: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              }}
            />

            <div className="mt-12 flex justify-center">
              <Pagination 
                classNames={{
                  list: 'flex gap-2',
                  item: 'w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 text-white/70 hover:bg-white  hover:text-white transition-colors cursor-pointer',
                  selectedItem: 'bg-[#C5A059] text-[#0A1128] font-bold border-[#C5A059] hover:bg-[#C5A059]',
                  disabledItem: 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-white/70'
                }}
              />
            </div>
          </div>

        </div>
      </InstantSearch>
    </div>
  );
};
