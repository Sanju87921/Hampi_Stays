import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Star, MapPin, Award, Clock, Users,
  CheckCircle, Globe, ShieldCheck, ArrowLeft,
  Calendar, Info
} from "lucide-react";
import { apiClient } from "../../utils/apiClient";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/shared/PageLoader";

export function GuideProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: guide, isLoading, error } = useQuery({
    queryKey: ['guideProfile', id],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const data = await apiClient.get<any>(`/guides/${id}`);
      return data;
    },
    enabled: !!id
  });

  if (isLoading) return <PageLoader />;
  if (error || !guide) return <Navigate to="/guides" replace />;

  return (
    <div className="min-h-screen bg-sand-50 pt-32 pb-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link
          to="/dashboard/expert-profile"
          className="inline-flex items-center gap-2 text-navy-950/60 hover:text-navy-900 font-semibold text-sm transition-colors group mb-8"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-sand-100 shadow-luxury mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 mix-blend-screen" />
          
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white shadow-xl overflow-hidden shrink-0 bg-sand-100">
              {guide.user?.avatar ? (
                <img src={guide.user.avatar} alt={guide.user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-serif text-navy-950/50">
                  {guide.user?.name?.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <span className="bg-gold-50 text-gold-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gold-200 inline-flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified Expert
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-950 mb-2">
                    {guide.user?.name}
                  </h1>
                  <p className="text-lg text-navy-950/60 italic flex items-center justify-center md:justify-start gap-1">
                    <MapPin className="w-4 h-4 text-gold-500" /> Hampi, Karnataka
                  </p>
                </div>
                
                <div className="flex flex-col items-center md:items-end bg-sand-50 px-6 py-4 rounded-2xl border border-sand-100">
                  <div className="flex items-center gap-1.5 text-2xl font-serif font-bold text-navy-950 mb-1">
                    <Star className="w-6 h-6 fill-gold-500 text-gold-500" />
                    {guide.rating > 0 ? guide.rating.toFixed(1) : "New"}
                  </div>
                  <p className="text-xs font-bold text-navy-950/40 uppercase tracking-widest">
                    {guide.reviewCount} Reviews
                  </p>
                </div>
              </div>

              <p className="text-navy-900 leading-relaxed text-lg mb-8 max-w-2xl">
                {guide.bio || "An experienced local guide ready to show you the wonders of Hampi."}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {guide.yearsExperience > 0 && (
                  <div className="flex items-center gap-2 bg-sand-50 px-4 py-2 rounded-xl border border-sand-100">
                    <Award className="w-4 h-4 text-gold-600" />
                    <span className="text-sm font-bold text-navy-950">{guide.yearsExperience}+ Years Experience</span>
                  </div>
                )}
                {guide.languages?.length > 0 && (
                  <div className="flex items-center gap-2 bg-sand-50 px-4 py-2 rounded-xl border border-sand-100">
                    <Globe className="w-4 h-4 text-gold-600" />
                    <span className="text-sm font-bold text-navy-950">{guide.languages.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-sand-100 shadow-sm">
              <h2 className="text-2xl font-serif font-bold text-navy-950 mb-6">Areas of Expertise</h2>
              <div className="flex flex-wrap gap-3">
                {guide.specialties?.length > 0 ? guide.specialties.map((s: string) => (
                  <span key={s} className="bg-gold-50 text-gold-800 px-4 py-2 rounded-xl text-sm font-bold border border-gold-100">
                    {s}
                  </span>
                )) : (
                  <span className="text-navy-950/40 text-sm">General Tours</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-sand-100 shadow-sm">
              <h2 className="text-2xl font-serif font-bold text-navy-950 mb-6">Signature Tours</h2>
              {guide.experiences && guide.experiences.length > 0 ? (
                <div className="space-y-6">
                  {guide.experiences.map((exp: any) => (
                    <div key={exp.id} className="flex flex-col md:flex-row gap-6 p-4 rounded-2xl border border-sand-100 hover:border-gold-300 transition-colors">
                      <div className="w-full md:w-48 h-32 rounded-xl bg-sand-100 overflow-hidden shrink-0">
                        {exp.imageUrl ? (
                          <img src={exp.imageUrl} alt={exp.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-navy-950/20">
                            <MapPin className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-navy-950 mb-2">{exp.title}</h3>
                        <p className="text-sm text-navy-950/60 mb-4 line-clamp-2">{exp.description}</p>
                        <div className="flex items-center gap-4 text-xs font-bold text-navy-950/40 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exp.durationHours} Hours</span>
                          {exp.price > 0 && <span className="flex items-center gap-1">₹{exp.price} / Person</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-navy-950/40 italic">This guide hasn't added any signature tours yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-navy-950 rounded-[2.5rem] p-8 text-white">
              <div className="text-center mb-8">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Daily Rate</p>
                <div className="text-4xl font-serif font-bold text-gold-400">
                  ₹{guide.pricePerDay?.toLocaleString() || 0}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle className="w-5 h-5 text-gold-500" />
                  Full day dedicated service
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle className="w-5 h-5 text-gold-500" />
                  Customized itineraries
                </div>
                <div className="flex items-center gap-3 text-sm text-white/80">
                  <CheckCircle className="w-5 h-5 text-gold-500" />
                  Local hidden gems
                </div>
              </div>

              <Link to={`/guides?guideId=${guide.id}`}>
                <Button className="w-full h-14 rounded-2xl bg-gold-500 text-navy-950 hover:bg-gold-400 font-bold shadow-gold">
                  Book This Guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
