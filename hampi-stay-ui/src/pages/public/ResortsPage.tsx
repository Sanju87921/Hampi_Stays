// ============================================================
// Resorts Page — /resorts
// Full search & discovery experience with filters, sort, 
// list/map view toggle, and compare functionality.
// ============================================================

import { useState, useCallback } from "react";
import { useSearchParams as useRouterSearchParams } from "react-router-dom";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { useResorts } from "../../hooks/useResorts";
import { ResortCard } from "../../components/resort/ResortCard";
import { ResortFilters } from "../../components/resort/ResortFilters";
import { SortBar } from "../../components/resort/SortBar";
import { ResortMap } from "../../components/resort/ResortMap";
import { CompareBar } from "../../components/resort/CompareBar";
import { SearchBar } from "../../components/resort/SearchBar";
import { ResortGridSkeleton } from "../../components/resort/ResortSkeleton";
import type { FilterState, SortOption, CompareItem, Resort } from "../../types/resort";

const DEFAULT_FILTERS: FilterState = {
  minPrice: 0,
  maxPrice: 60000,
  amenities: [],
  types: [],
  minRating: 0,
};

export function ResortsPage() {
  const [searchParams] = useRouterSearchParams();
  const location = searchParams.get("location") ?? "";
  const adults = Number(searchParams.get("adults") ?? 1);
  const children = Number(searchParams.get("children") ?? 0);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("popularity");
  const [view, setView] = useState<"list" | "map">("list");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

  const { resorts, total, isEmpty, maxPrice, isLoading, error } = useResorts({
    search: { location, adults, children },
    filters,
    sort,
  });

  const handleCompareToggle = useCallback((resort: Resort) => {
    setCompareItems((prev) => {
      const exists = prev.find((i) => i.resortId === resort.id);
      if (exists) return prev.filter((i) => i.resortId !== resort.id);
      if (prev.length >= 3) return prev;
      return [...prev, { resortId: resort.id, resortSlug: resort.slug, resortName: resort.name }];
    });
  }, []);

  return (
    <>
      <div className="min-h-screen bg-sand-50 pt-20">
        {/* Search Header */}
        <div className="bg-navy-950 py-8 px-4">
          <div className="container mx-auto max-w-5xl">
            <SearchBar />
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-8">
          {/* Active Search Info */}
          {location && (
            <div className="flex items-center gap-2 mb-6 text-navy-950/60">
              <Search className="w-4 h-4" />
              <span className="text-sm">
                Results for <strong className="text-navy-950">"{location}"</strong>
              </span>
            </div>
          )}

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <ResortFilters
                filters={filters}
                onChange={setFilters}
                maxPrice={maxPrice}
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Filter Button */}
              <div className="flex items-center gap-3 mb-4 lg:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-sand-200 bg-white text-navy-900 font-semibold text-sm hover:border-stone-400 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {(filters.amenities.length + filters.types.length + (filters.minRating > 0 ? 1 : 0)) > 0 && (
                    <span className="bg-gold-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {filters.amenities.length + filters.types.length + (filters.minRating > 0 ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>

              {/* Sort Bar */}
              <SortBar
                sort={sort}
                onSortChange={setSort}
                view={view}
                onViewChange={setView}
                total={total}
              />

              {/* Loading State */}
              {isLoading ? (
                <div className="mt-6">
                  <ResortGridSkeleton />
                </div>
              ) : error ? (
                <div className="bg-red-50 p-8 rounded-3xl border border-red-100 text-center mt-6">
                  <p className="text-red-600 font-bold mb-2">Connection Error</p>
                  <p className="text-red-950/60 text-sm">We couldn't reach the HampiStays vault. Please ensure your local database is running.</p>
                </div>
              ) : (
                <>
                  {/* Map View */}
                  {view === "map" && (
                    <div className="mt-6 rounded-3xl overflow-hidden border border-sand-200" style={{ height: "600px" }}>
                      <ResortMap resorts={resorts} className="w-full h-full" />
                    </div>
                  )}

                  {/* List View */}
                  {view === "list" && (
                    <>
                      {isEmpty ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-24 text-center"
                        >
                          <div className="text-6xl mb-4">🏨</div>
                          <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">
                            No resorts found
                          </h3>
                          <p className="text-navy-950/60 mb-6 max-w-sm">
                            Try adjusting your filters or searching a different location.
                          </p>
                          <button
                            type="button"
                            onClick={() => setFilters(DEFAULT_FILTERS)}
                            className="flex items-center gap-2 text-gold-600 font-bold hover:underline"
                          >
                            <X className="w-4 h-4" /> Clear all filters
                          </button>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                          {resorts.map((resort, index) => (
                            <ResortCard
                              key={resort.id}
                              resort={resort}
                              index={index}
                              isInCompare={compareItems.some((i) => i.resortId === resort.id)}
                              onCompareToggle={handleCompareToggle}
                              compareDisabled={compareItems.length >= 3}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Slide-In */}
      <ResortFilters
        filters={filters}
        onChange={setFilters}
        maxPrice={maxPrice}
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
      />

      {/* Compare Bar */}
      <CompareBar
        items={compareItems}
        onRemove={(id) => setCompareItems((p) => p.filter((i) => i.resortId !== id))}
        onClear={() => setCompareItems([])}
      />
    </>
  );
}
