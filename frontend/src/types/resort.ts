// ============================================================
// Central Resort Types — HampiStays Phase 2
// All search/listing/detail types live here.
// To swap mock data for Supabase, only change src/data/resorts.ts
// ============================================================

export type ResortType = "luxury" | "boutique" | "eco" | "heritage" | "budget";

export type Amenity =
  | "Pool"
  | "Spa"
  | "WiFi"
  | "Restaurant"
  | "Bar"
  | "Parking"
  | "Gym"
  | "Yoga"
  | "River View"
  | "Heritage View"
  | "Organic Food"
  | "Guided Tours"
  | "Cycling"
  | "Campfire"
  | "Rooftop"
  | "Air Conditioning"
  | "Pet Friendly"
  | "Airport Transfer"
  | "Breakfast Included"
  | "Airport Shuttle"
  | "Bonfire Night"
  | "Laundry"
  | "Library";

export interface RoomPriceOverride {
  id: string;
  date: string;
  price: number;
  minNights?: number;
}

export interface RoomBlocking {
  id: string;
  date: string;
  reason?: string;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  pricePerNight: number; // in INR
  capacity: number; // max guests
  amenities: Amenity[];
  images: string[];
  availableCount: number;
  minNights?: number;
  priceOverrides?: RoomPriceOverride[];
  blockings?: RoomBlocking[];
}

export interface Resort {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  type: ResortType;
  location: {
    area: string;
    district: string;
    state: string;
    lat: number;
    lng: number;
    distanceFromCenterKm: number;
  };
  images: string[]; // First image is the hero/thumbnail
  amenities: Amenity[];
  rating: number; // 1.0 – 5.0
  reviewCount: number;
  pricePerNight: number; // starting price in INR
  roomTypes: RoomType[];
  policies: {
    checkIn: string;  // e.g. "2:00 PM"
    checkOut: string; // e.g. "11:00 AM"
    cancellation: string;
    petsAllowed: boolean;
    smokingAllowed: boolean;
    minNights: number;
    maxNights: number;
  };
  nearbyAttractions: NearbyAttraction[];
  isFeatured: boolean;
  isVerified: boolean;
  createdAt: string; // ISO date string
  mealPackages?: { name: string; price: number; description: string; }[];
  categories?: string[];
  category?: string;
  locationArea?: string;
}

export interface NearbyAttraction {
  name: string;
  type: "temple" | "lake" | "ruins" | "market" | "viewpoint" | "activity";
  distanceKm: number;
  description: string;
  imageUrl?: string;
}

// ============================================================
// Search / Filter Types
// ============================================================

export interface SearchParams {
  location: string;
  checkIn: string;   // ISO date string e.g. "2024-12-01"
  checkOut: string;  // ISO date string e.g. "2024-12-05"
  adults: number;
  children: number;
}

export interface FilterState {
  minPrice: number;
  maxPrice: number;
  amenities: Amenity[];
  types: ResortType[];
  minRating: number;
  categories: string[];
}

export type SortOption = "rating" | "price_asc" | "price_desc" | "newest" | "popularity";

export interface CompareItem {
  resortId: string;
  resortSlug: string;
  resortName: string;
}
