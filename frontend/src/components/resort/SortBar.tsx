import { LayoutGrid, Map as MapIcon, ChevronDown } from "lucide-react";
import type { SortOption } from "../../types/resort";

interface SortBarProps {
 sort: SortOption;
 onSortChange: (sort: SortOption) => void;
 view: "list" | "map";
 onViewChange: (view: "list" | "map") => void;
 total: number;
}

export function SortBar({ sort, onSortChange, view, onViewChange, total }: SortBarProps) {
 const sortOptions: { value: SortOption; label: string }[] = [
 { value: "popularity", label: "Most Popular" },
 { value: "price_asc", label: "Price: Low to High" },
 { value: "price_desc", label: "Price: High to Low" },
 { value: "rating", label: "Top Rated" },
 ];

 return (
 <div className="bg-white rounded-3xl border border-sand-200 p-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm mb-6">
 <div className="flex items-center gap-4 px-4 py-2">
 <span className="text-sm font-bold text-navy-950 ">
 {total} <span className="text-navy-950 ">Sanctuaries found</span>
 </span>
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto">
 {/* Sort Dropdown */}
 <div className="relative group flex-grow sm:flex-grow-0">
 <select
 value={sort}
 onChange={(e) => onSortChange(e.target.value as SortOption)}
 className="w-full sm:w-48 appearance-none bg-sand-50 border border-sand-100 rounded-2xl px-5 py-3 text-sm font-bold text-navy-950 cursor-pointer hover:bg-sand-100 :bg-sand-200 transition-colors outline-none pr-10"
 >
 {sortOptions.map((opt) => (
 <option key={opt.value} value={opt.value}>
 {opt.label}
 </option>
 ))}
 </select>
 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950 pointer-events-none" />
 </div>

 {/* View Toggle */}
 <div className="flex items-center bg-sand-50 p-1.5 rounded-2xl border border-sand-100 ">
 <button
 onClick={() => onViewChange("list")}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
 view === "list"
 ? "bg-white text-navy-950 shadow-sm"
 : "text-navy-950 hover:text-navy-950 "
 }`}
 >
 <LayoutGrid className="w-4 h-4" />
 List
 </button>
 <button
 onClick={() => onViewChange("map")}
 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
 view === "map"
 ? "bg-white text-navy-950 shadow-sm"
 : "text-navy-950 hover:text-navy-950 "
 }`}
 >
 <MapIcon className="w-4 h-4" />
 Map
 </button>
 </div>
 </div>
 </div>
 );
}
