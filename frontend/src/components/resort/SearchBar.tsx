// ============================================================
// SearchBar — Fully Functional (Phase 2)
// Replaces the static placeholder. Manages location, date 
// range, and guest count. Navigates to /resorts with URL params.
// ============================================================

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalIcon, Users, MapPin, Search, Minus, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../ui/Button";
import { Calendar, type DateRange } from "../ui/Calendar";
import { cn } from "../../utils/cn";
import { useTranslation } from "react-i18next";

type Panel = "location" | "dates" | "guests" | null;

interface GuestCount {
  adults: number;
  children: number;
}

const LOCATIONS = [
  "Hampi",
  "Kamalapura",
  "Virupapur Gaddi",
  "Hospet Road",
  "Tungabhadra Riverbank",
];

export function SearchBar() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [guests, setGuests] = useState<GuestCount>({ adults: 2, children: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Location suggestions
  useEffect(() => {
    if (location.length > 0) {
      setSuggestions(
        LOCATIONS.filter((l) => l.toLowerCase().includes(location.toLowerCase()))
      );
    } else {
      setSuggestions(LOCATIONS);
    }
  }, [location]);

  const togglePanel = (panel: Panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const adjustGuest = (type: keyof GuestCount, delta: number) => {
    setGuests((prev) => {
      const next = prev[type] + delta;
      if (type === "adults") return { ...prev, adults: Math.max(1, Math.min(12, next)) };
      return { ...prev, children: Math.max(0, Math.min(8, next)) };
    });
  };

  const formatDateLabel = () => {
    if (!dateRange.from) return "Add dates";
    if (!dateRange.to) return format(dateRange.from, "MMM d");
    return `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`;
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (dateRange.from) params.set("checkIn", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) params.set("checkOut", format(dateRange.to, "yyyy-MM-dd"));
    params.set("adults", String(guests.adults));
    if (guests.children > 0) params.set("children", String(guests.children));
    setActivePanel(null);

    // If destination OR dates are selected → go to Register
    if (location || dateRange.from) {
      navigate(`/register?${params.toString()}`);
    } else {
      // Nothing selected yet — open location panel to guide user
      setActivePanel("location");
    }
  };

  const guestLabel = t("hero.guestCount", { count: guests.adults + guests.children });

  return (
    <div ref={wrapperRef} className="relative">
      {/* Main Bar */}
      <div className="bg-white  backdrop-blur-xl rounded-[2.5rem] md:rounded-full shadow-luxury p-3 md:p-[10px] max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-3 md:gap-0 border border-white/60 relative group transition-all duration-300 hover:shadow-luxury-hover hover:bg-white ">

        {/* Location */}
        <button
          type="button"
          className={cn(
            "flex-1 w-full md:w-auto px-8 py-4 md:py-[11px] rounded-full transition-all duration-300 cursor-pointer relative text-left",
            activePanel === "location" ? "bg-white  shadow-md z-10" : "hover:bg-sand-100 :bg-zinc-700/50"
          )}
          onClick={() => togglePanel("location")}
        >
          <span className="block text-[11px] font-bold text-navy-950  uppercase tracking-widest mb-1.5">
            {t("hero.search")}
          </span>
          <div className="flex items-center gap-3 text-navy-950  ">
            <MapPin className="w-5 h-5 text-gold-500 flex-shrink-0" />
            <span className={cn("text-base font-medium truncate", location ? "text-navy-950 " : "text-navy-800/40")}>
              {location || t("hero.searchPlaceholder")}
            </span>
          </div>
          <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-sand-200  group-hover:bg-transparent transition-colors" />
        </button>

        {/* Dates */}
        <button
          type="button"
          className={cn(
            "flex-1 w-full md:w-auto px-8 py-4 md:py-[11px] rounded-full transition-all duration-300 cursor-pointer relative text-left",
            activePanel === "dates" ? "bg-white  shadow-md z-10" : "hover:bg-sand-100 :bg-zinc-700/50"
          )}
          onClick={() => togglePanel("dates")}
        >
          <span className="block text-[11px] font-bold text-navy-950  uppercase tracking-widest mb-1.5">
            {t("hero.checkIn")} - {t("hero.checkOut")}
          </span>
          <div className="flex items-center gap-3 text-navy-950  ">
            <CalIcon className="w-5 h-5 text-gold-500 flex-shrink-0" />
            <span className={cn("text-base font-medium truncate", dateRange.from ? "text-navy-950 " : "text-navy-800/40")}>
              {formatDateLabel()}
            </span>
          </div>
          <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-sand-200  group-hover:bg-transparent transition-colors" />
        </button>

        {/* Guests + Search */}
        <div
          className={cn(
            "flex-[1.2] w-full md:w-auto pl-8 pr-3 py-4 md:py-[6px] rounded-full transition-all duration-300 flex justify-between items-center",
            activePanel === "guests" ? "bg-white  shadow-md z-10" : "hover:bg-sand-100 :bg-zinc-700/50"
          )}
        >
          <button
            type="button"
            className="text-left flex-1"
            onClick={() => togglePanel("guests")}
          >
            <span className="block text-[11px] font-bold text-navy-950  uppercase tracking-widest mb-1.5">
              {t("hero.guests")}
            </span>
            <div className="flex items-center gap-3 text-navy-950  ">
              <Users className="w-5 h-5 text-gold-500 flex-shrink-0" />
              <span className="text-base font-medium text-navy-950 ">{guestLabel}</span>
            </div>
          </button>

          <Button
            type="button"
            size="lg"
            onClick={handleSearch}
            className="w-14 h-14 md:w-auto md:h-[54px] p-0 md:px-8 rounded-full ml-4 flex items-center justify-center gap-2 flex-shrink-0 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-navy-950 hover:bg-gold-600 border-none"
          >
            <Search className="w-5 h-5 text-white" />
            <span className="hidden md:inline font-bold text-white text-base">{t("common.search")}</span>
          </Button>
        </div>
      </div>

      {/* ── Dropdowns ────────────────────────────────────────── */}

      {/* Location Dropdown */}
      {activePanel === "location" && (
        <div className="absolute top-full left-0 mt-3 bg-white  rounded-[2rem] shadow-luxury border border-sand-100  p-6 w-full md:w-96 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              autoFocus
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where in Hampi?"
              className="w-full pl-11 pr-10 py-3.5 bg-sand-50  border border-sand-200  rounded-2xl text-navy-950  placeholder:text-navy-950   text-sm font-semibold outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-500/5 transition-all"
            />
            {location && (
              <button
                type="button"
                onClick={() => setLocation("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-sand-100 :bg-zinc-700 rounded-full text-navy-950   hover:text-navy-950  transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="px-1">
            <p className="text-[10px] font-bold text-navy-950   uppercase tracking-[0.2em] mb-4 text-center">
              Suggestions
            </p>
            <div className="space-y-1 max-h-72 overflow-y-auto no-scrollbar">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setLocation(s); setActivePanel("dates"); }}
                  className="w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-sand-50 :bg-zinc-800 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-sand-50  flex items-center justify-center text-navy-950   group-hover:bg-gold-50 group-hover:text-gold-600 transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-navy-950  group-hover:text-gold-600 transition-colors">{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dates Dropdown */}
      {activePanel === "dates" && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <Calendar
            selected={dateRange}
            onSelect={(range: DateRange | undefined) => {
              setDateRange(range ?? { from: undefined, to: undefined });
              if (range?.from && range?.to) setActivePanel("guests");
            }}
          />
          {(dateRange.from || dateRange.to) && (
            <div className="mt-2 flex justify-end px-4 pb-2">
              <button
                type="button"
                onClick={() => setDateRange({ from: undefined, to: undefined })}
                className="text-xs text-navy-950   hover:text-gold-600 font-semibold underline"
              >
                Clear dates
              </button>
            </div>
          )}
        </div>
      )}

      {/* Guests Dropdown */}
      {activePanel === "guests" && (
        <div className="absolute top-full right-0 mt-3 bg-white  rounded-3xl shadow-luxury border border-sand-100  p-6 w-80 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[11px] font-bold text-navy-800/40 uppercase tracking-widest mb-5">
            Guests
          </p>

          {/* Adults */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-semibold text-navy-950 ">Adults</p>
              <p className="text-xs text-navy-950  ">Ages 13 and above</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustGuest("adults", -1)}
                disabled={guests.adults <= 1}
                className="w-8 h-8 rounded-full border border-sand-300 flex items-center justify-center text-navy-950   hover:border-sand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-5 text-center font-bold text-navy-950 ">{guests.adults}</span>
              <button
                type="button"
                onClick={() => adjustGuest("adults", 1)}
                disabled={guests.adults >= 12}
                className="w-8 h-8 rounded-full border border-sand-300 flex items-center justify-center text-navy-950   hover:border-sand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-navy-950 ">Children</p>
              <p className="text-xs text-navy-950  ">Ages 2–12</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustGuest("children", -1)}
                disabled={guests.children <= 0}
                className="w-8 h-8 rounded-full border border-sand-300 flex items-center justify-center text-navy-950   hover:border-sand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-5 text-center font-bold text-navy-950 ">{guests.children}</span>
              <button
                type="button"
                onClick={() => adjustGuest("children", 1)}
                disabled={guests.children >= 8}
                className="w-8 h-8 rounded-full border border-sand-300 flex items-center justify-center text-navy-950   hover:border-sand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSearch}
            className="w-full mt-6 bg-navy-950 hover:bg-gold-600 text-white rounded-xl font-bold border-none transition-colors"
          >
            Search Resorts
          </Button>
        </div>
      )}
    </div>
  );
}
