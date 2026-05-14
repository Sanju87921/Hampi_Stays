// ============================================================
// ResortDetail Page — /resorts/:slug
// Full resort detail: photo gallery, amenities, policies,
// sticky booking widget, nearby attractions.
// ============================================================

import React, { useState } from "react";
import toast from "react-hot-toast";
import { useParams, useSearchParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, CheckCircle, XCircle,
  Wifi, Coffee, Car, Dumbbell, Waves, Share2, Heart
} from "lucide-react";
import { BookingWidget } from "../../components/resort/BookingWidget";
import { AttractionsGuide } from "../../components/resort/AttractionsGuide";
import { ResortMap } from "../../components/resort/ResortMap";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { apiClient } from "../../utils/apiClient";
import { useWishlist } from "../../context/WishlistContext";
import { useProtectedAction } from "../../hooks/useProtectedAction";
import type { Resort } from "../../types/resort";
import { optimizeImage } from "../../utils/image";

const AMENITY_ICON: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-5 h-5" />,
  Restaurant: <Coffee className="w-5 h-5" />,
  Parking: <Car className="w-5 h-5" />,
  Gym: <Dumbbell className="w-5 h-5" />,
  Pool: <Waves className="w-5 h-5" />,
};

export function ResortDetailPage() {
  const { isFavorite, toggleWishlist } = useWishlist();
  const { protect } = useProtectedAction();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const { data: resort, isLoading, error } = useQuery({
    queryKey: ['resort', slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug is required");
      const data = await apiClient.get<any>(`/resorts/${slug}`);
      
      return {
        ...data,
        location: {
          area: data.locationArea,
          district: "Hampi",
          distanceFromCenterKm: 5,
          lat: data.locationLat,
          lng: data.locationLng
        },
        policies: data.policies || {
          checkIn: "2:00 PM",
          checkOut: "11:00 AM",
          minNights: 1,
          petsAllowed: false,
          cancellation: "Free cancellation 48h before check-in"
        },
        nearbyAttractions: data.nearbyAttractions || []
      } as Resort;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 2, // Revalidate detail data every 2 mins
    refetchInterval: 1000 * 60 * 5, // Re-sync availability in background
  });

  if (isLoading) return (
    <div className="min-h-screen bg-sand-50 pt-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-[420px] md:h-[560px] bg-sand-100 rounded-3xl animate-pulse mb-10" />
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            <div className="h-12 w-3/4 bg-sand-200 rounded-2xl animate-pulse" />
            <div className="h-6 w-1/2 bg-sand-100 rounded-xl animate-pulse" />
            <div className="h-32 bg-sand-50 rounded-2xl animate-pulse" />
          </div>
          <div className="w-96 h-[500px] bg-sand-200 rounded-3xl animate-pulse hidden lg:block" />
        </div>
      </div>
    </div>
  );

  if (!resort || error) return <Navigate to="/resorts" replace />;

  const images = resort.images;
  const checkIn = searchParams.get("checkIn") ?? undefined;
  const checkOut = searchParams.get("checkOut") ?? undefined;
  const adults = Number(searchParams.get("adults") ?? 2);

  return (
    <div className="min-h-screen bg-sand-50 pt-32">
      <div className="container mx-auto px-4 md:px-6 pb-6 relative z-10">
        <Link
          to="/resorts"
          className="inline-flex items-center gap-2 text-navy-950/60 hover:text-navy-900 font-semibold text-sm transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Resorts
        </Link>
      </div>

      <div className="container mx-auto px-4 md:px-6 mb-8">
        <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[420px] md:h-[560px] rounded-2xl overflow-hidden">
          <div
            className="col-span-4 md:col-span-2 row-span-2 relative cursor-pointer overflow-hidden"
            onClick={() => setGalleryIdx(0)}
          >
            <img
              src={imgErrors['main'] ? "/images/hampi-1.png" : optimizeImage(images[galleryIdx] ?? images[0], 1200)}
              alt={resort.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
              onError={() => setImgErrors(prev => ({ ...prev, ['main']: true }))}
            />
          </div>
          {images.slice(1, 5).map((img: string, i: number) => (
            <div
              key={img}
              className="hidden md:block relative cursor-pointer overflow-hidden rounded-2xl"
              onClick={() => setGalleryIdx(i + 1)}
            >
              <img
                src={imgErrors[`gallery-${i}`] ? "/images/hampi-2.png" : optimizeImage(img, 600)}
                alt={`${resort.name} photo ${i + 2}`}
                className={`w-full h-full object-cover hover:scale-105 transition-transform duration-700 ${galleryIdx === i + 1 ? "ring-4 ring-gold-500" : ""}`}
                onError={() => setImgErrors(prev => ({ ...prev, [`gallery-${i}`]: true }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 pb-24">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-navy-950/50 mb-2">
                    <MapPin className="w-4 h-4 text-gold-500" />
                    <span className="text-sm font-medium">
                      {resort.location?.area || (resort as any).locationArea || "Hampi"}, Hampi — {resort.location?.distanceFromCenterKm || 5} km from city centre
                    </span>
                  </div>

                  <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-950 mb-3 leading-tight">
                    {resort.name}
                  </h1>

                  <p className="text-lg text-gold-600 font-medium italic mb-2">{resort.tagline}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: resort.name,
                            text: resort.tagline,
                            url: window.location.href,
                          });
                        } catch (err) {
                          console.log("Share failed", err);
                        }
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied to clipboard!");
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-sand-200 text-navy-950 font-bold text-sm hover:bg-sand-50 transition-all shadow-sm active:scale-95"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button 
                    onClick={() => protect(
                      () => toggleWishlist(resort.id),
                      { message: "Save to your collection", view: "register" }
                    )}
                    className={cn(
                      "p-3 rounded-2xl bg-white border border-sand-200 transition-all shadow-sm active:scale-95",
                      isFavorite(resort.id) ? "text-red-500 border-red-100 bg-red-50" : "text-navy-950 hover:text-red-500"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", isFavorite(resort.id) && "fill-current")} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(resort.rating) ? "fill-gold-500 text-gold-500" : "text-stone-200"}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-navy-950">{resort.rating}</span>
                <span className="text-navy-950/50 text-sm">({resort.reviewCount} reviews)</span>
                {resort.isVerified && (
                  <div className="flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </div>
                )}
              </div>
            </motion.div>

            <section className="mb-10">
              <h2 className="text-2xl font-bold font-serif text-navy-950 mb-4">About this property</h2>
              <p className="text-navy-900 leading-relaxed text-lg">{resort.description}</p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold font-serif text-navy-950 mb-5">What's included</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {resort.amenities.map((amenity: string) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-sand-100 shadow-sm"
                  >
                    <span className="text-gold-500">
                      {AMENITY_ICON[amenity] ?? <CheckCircle className="w-5 h-5" />}
                    </span>
                    <span className="text-navy-950 font-medium text-sm">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-10" id="rooms">
              <h2 className="text-2xl font-bold font-serif text-navy-950 mb-6">Choose Your Stay</h2>
              <div className="space-y-4">
                {resort.roomTypes.map((room: any) => {
                  const isSelected = selectedRoomId === room.id;
                  return (
                    <div
                      key={room.id}
                      className={cn(
                        "group p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col md:flex-row gap-6",
                        isSelected
                          ? "bg-gold-50/50 border-gold-500 shadow-luxury"
                          : "bg-white border-sand-100 hover:border-gold-300"
                      )}
                    >
                      <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0 bg-sand-100">
                        <img
                          src={optimizeImage(room.images?.[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600', 600)}
                          alt={room.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/hampi-1.png';
                          }}
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-bold text-navy-950 mb-1">{room.name}</h4>
                            <p className="text-sm text-navy-950/60 mb-3">{room.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {room.amenities.map((a: string) => (
                                <span key={a} className="text-[10px] font-bold uppercase tracking-wider text-navy-950/40 bg-sand-50 px-2 py-0.5 rounded-md border border-sand-100">
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-left md:text-right shrink-0">
                            <div className="flex items-baseline gap-1 md:justify-end mb-2">
                              <span className="text-2xl font-serif font-bold text-navy-950">₹{room.pricePerNight.toLocaleString("en-IN")}</span>
                              <span className="text-sm text-navy-950/50">/night</span>
                            </div>
                            <button
                              onClick={() => setSelectedRoomId(room.id)}
                              className={cn(
                                "px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                                isSelected
                                  ? "bg-gold-600 text-white shadow-gold"
                                  : "bg-navy-950 text-white hover:bg-gold-500 hover:text-navy-950"
                              )}
                            >
                              {isSelected ? "Selected" : "Select Room"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold font-serif text-navy-950 mb-5">Property Rules</h2>
              <div className="bg-white rounded-3xl border border-sand-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-navy-800/40 uppercase tracking-widest mb-1">Check-in</p>
                  <p className="font-semibold text-navy-950">{resort.policies.checkIn}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-navy-800/40 uppercase tracking-widest mb-1">Check-out</p>
                  <p className="font-semibold text-navy-950">{resort.policies.checkOut}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-navy-800/40 uppercase tracking-widest mb-1">Min. Stay</p>
                  <p className="font-semibold text-navy-950">{resort.policies.minNights} night{resort.policies.minNights !== 1 ? "s" : ""}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-navy-800/40 uppercase tracking-widest mb-1">Pets</p>
                  <div className={`flex items-center gap-1.5 font-semibold ${resort.policies.petsAllowed ? "text-green-700" : "text-red-600"}`}>
                    {resort.policies.petsAllowed
                      ? <><CheckCircle className="w-4 h-4" /> Allowed</>
                      : <><XCircle className="w-4 h-4" /> Not allowed</>
                    }
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-navy-800/40 uppercase tracking-widest mb-1">Cancellation</p>
                  <p className="text-navy-900">{resort.policies.cancellation}</p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold font-serif text-navy-950 mb-5">Location</h2>
              <div className="h-64 rounded-3xl overflow-hidden border border-sand-200 mb-4">
                <ResortMap resorts={[resort]} className="w-full h-full" />
              </div>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${resort.location.lat},${resort.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-sand-200 text-navy-950 font-bold rounded-2xl hover:bg-sand-50 transition-all shadow-sm active:scale-95"
              >
                <MapPin className="w-4 h-4 text-gold-500" />
                Get Directions to Resort
              </a>
            </section>

            <AttractionsGuide attractions={resort.nearbyAttractions} />
          </div>

          <aside className="lg:w-96 flex-shrink-0">
            <div className="sticky top-24">
              <BookingWidget
                resort={resort}
                initialCheckIn={checkIn}
                initialCheckOut={checkOut}
                initialAdults={adults}
                selectedRoomId={selectedRoomId}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="md:hidden fixed bottom-24 left-0 right-0 z-40 px-4 pointer-events-none">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-white/90 backdrop-blur-xl border border-sand-200 rounded-3xl p-4 shadow-luxury flex items-center justify-between pointer-events-auto"
        >
          <div>
            <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-1">Starting from</p>
            <p className="text-xl font-serif font-bold text-navy-950">₹{resort.pricePerNight?.toLocaleString()}<span className="text-xs font-sans font-normal text-navy-950/50">/night</span></p>
          </div>
          <Button
            className="px-8 rounded-2xl shadow-gold"
            onClick={() => {
              const el = document.getElementById('rooms');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Check Availability
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

