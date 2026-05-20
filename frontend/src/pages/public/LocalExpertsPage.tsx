import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { 
  ShieldCheck, Search, Sparkles, CheckCircle2,
  Calendar, Clock, MapPin, X, Award, Star, ArrowRight
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { ImmersiveBackground } from "../../components/layout/ImmersiveBackground";
import { PremiumIcon } from "../../components/ui/PremiumIcon";
import { apiClient } from "../../utils/apiClient";
import { useSystem } from "../../context/SystemContext";

const EXPERT_IMAGES = [
  "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1590050752117-23a9d7f28a97?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1524230652367-a7ff3337f7e7?auto=format&fit=crop&q=80&w=2000"
];

interface Guide {
  id: string;
  bio: string;
  specialties: string[];
  languages: string[];
  pricePerDay: number;
  pricePerHour: number;
  yearsExperience: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  experiences: any[];
}

export function LocalExpertsPage() {
  const { user, requireAuth } = useAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingHours, setBookingHours] = useState(4);
  const [bookingMeetingPoint, setBookingMeetingPoint] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { settings } = useSystem();
  const guideServiceEnabled = settings?.guideServiceEnabled ?? true;


  const fetchGuides = async () => {
    try {
      const data = await apiClient.get<Guide[]>('/guides');
      setGuides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch guides", err);
      setGuides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleBookGuide = async () => {
    if (!selectedGuide || !bookingDate || !bookingMeetingPoint) return;
    if (!requireAuth()) {
      return;
    }
    setIsBooking(true);
    try {
      const totalPrice = selectedGuide.pricePerDay * (bookingHours / 8);
      await apiClient.post(`/guides/${selectedGuide.id}/book`, {
        userId: user.id,
        guideId: selectedGuide.id,
        date: bookingDate,
        durationHours: bookingHours,
        meetingPoint: bookingMeetingPoint,
        totalPrice,
      });
      setBookingSuccess(true);
      setBookingDate("");
      setBookingMeetingPoint("");
      setBookingHours(4);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedGuide(null);
      }, 2500);
    } catch (err) {
      console.error("Booking failed", err);
    } finally {
      setIsBooking(false);
    }
  };

  const filteredGuides = guides.filter(guide => 
    guide.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!guideServiceEnabled) {
    return (
      <div className="min-h-screen bg-sand-50 pt-40 pb-20 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <PremiumIcon icon={X} variant="sand" size="xl" className="mx-auto mb-8" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-950 mb-6">Service <span className="text-red-500 italic">Paused</span></h1>
            <p className="text-lg text-navy-950/60 leading-relaxed mb-10">
              The Hampi Expert Network is currently undergoing a scheduled maintenance shutdown. 
              New bookings and guide registrations are temporarily suspended.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/resorts">
                <Button className="h-14 px-8 rounded-2xl bg-navy-950 text-white w-full sm:w-auto">Explore Stays</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Header Section */}
      <section className="relative pt-40 pb-20 overflow-hidden min-h-[70vh] flex items-center">
        <ImmersiveBackground images={EXPERT_IMAGES} interval={3000} />
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <PremiumIcon icon={Award} variant="gold" size="sm" className="mr-2" /> Hampi Expert Network
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-navy-950 mb-6">
              Meet the <span className="text-gold-600 italic">Storytellers</span>
            </h1>
            <p className="text-lg text-navy-950/60 max-w-2xl mx-auto leading-relaxed mb-12">
              Our certified local experts are more than just guides—they are historians, 
              archaeologists, and guardians of Hampi's ancient legacy.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto relative group">
              <div className="absolute inset-0 bg-gold-500/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center bg-white rounded-2xl shadow-luxury p-2 border border-sand-200">
                <Search className="w-5 h-5 text-navy-950/20 ml-4" />
                <input 
                  type="text" 
                  placeholder="Search by name or specialty (e.g. Architecture)"
                  className="flex-1 h-12 px-4 bg-transparent outline-none text-navy-950 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button className="rounded-xl px-8 bg-navy-950 text-white h-12">Search</Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Experts Grid */}
      <section className="container mx-auto px-4 pb-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => <div key={i} className="h-[600px] bg-white rounded-[3rem] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredGuides.map((guide, i) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-[3rem] border border-sand-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 flex flex-col"
              >
                {/* Profile Header */}
                <div className="p-10 pb-6 border-b border-sand-50">
                  <div className="flex items-start justify-between mb-6">
                    {/* Real Avatar */}
                    <div className="w-24 h-24 rounded-3xl bg-sand-50 border-2 border-sand-100 overflow-hidden flex items-center justify-center shadow-inner">
                      {guide.user.avatar ? (
                        <img src={guide.user.avatar} className="w-full h-full object-cover rounded-full" alt={guide.user.name} />
                      ) : (
                        <span className="text-4xl font-serif font-bold text-navy-950 group-hover:text-gold-600 transition-colors duration-500">
                          {guide.user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    {/* Real Rating */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-gold-500 mb-1 justify-end">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold text-navy-950">
                          {guide.rating > 0 ? guide.rating.toFixed(1) : "New"}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">
                        {guide.reviewCount > 0 ? `${guide.reviewCount} reviews` : "No reviews yet"}
                      </p>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">{guide.user.name}</h3>
                  <div className="flex items-center gap-2 text-green-600 font-bold text-[10px] uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" /> ASI Certified Expert
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-10 flex-1 space-y-8">
                  <p className="text-navy-950/60 text-sm leading-relaxed line-clamp-3">{guide.bio}</p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm font-bold text-navy-950/40 uppercase tracking-widest">
                      <Sparkles className="w-4 h-4 text-gold-500" /> Specialties
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {guide.specialties.map(s => (
                        <span key={s} className="px-4 py-1.5 bg-sand-50 rounded-xl text-[10px] font-bold text-navy-950/70 border border-sand-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-sand-50">
                    <div className="flex items-center gap-4">
                      {guide.yearsExperience > 0 && (
                        <>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">Experience</span>
                            <span className="text-sm font-bold text-navy-950">{guide.yearsExperience}+ Years</span>
                          </div>
                          <div className="w-px h-8 bg-sand-100" />
                        </>
                      )}
                      {guide.languages.length >= 2 && (
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">Languages</span>
                          <span className="text-sm font-bold text-navy-950">{guide.languages.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-8 pt-0 flex gap-4">
                  <Button 
                    onClick={() => { 
                      if (requireAuth()) {
                        setSelectedGuide(guide); 
                        setBookingSuccess(false); 
                      }
                    }}
                    className="flex-1 rounded-2xl h-14 bg-navy-950 text-white group/btn border-none font-bold"
                  >
                    Book Expert
                    <Calendar className="w-4 h-4 ml-2" />
                  </Button>
                  <Link to="/experiences" className="flex-1">
                    <Button variant="outline" className="w-full rounded-2xl h-14 border-sand-200 text-navy-950 font-bold">
                      View Tours
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        <AnimatePresence>
          {selectedGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-luxury border border-sand-200 relative overflow-hidden"
              >
                <button 
                  onClick={() => setSelectedGuide(null)}
                  className="absolute top-8 right-8 w-10 h-10 rounded-full bg-sand-50 flex items-center justify-center text-navy-950/40 hover:bg-sand-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 rounded-2xl bg-sand-50 border border-sand-100 overflow-hidden flex items-center justify-center">
                    {selectedGuide.user.avatar ? (
                      <img src={selectedGuide.user.avatar} className="w-full h-full object-cover rounded-full" alt={selectedGuide.user.name} />
                    ) : (
                      <span className="text-3xl font-serif font-bold text-navy-950">{selectedGuide.user.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-3xl font-serif font-bold text-navy-950">Book {selectedGuide.user.name}</h3>
                    <p className="text-sm text-gold-600 font-bold uppercase tracking-widest mt-1">Private Heritage Session</p>
                  </div>
                </div>

                {/* Success State */}
                <AnimatePresence>
                  {bookingSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 bg-green-50 border border-green-100 text-green-700 px-6 py-4 rounded-2xl mb-6"
                    >
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">Booking Request Sent!</p>
                        <p className="text-xs opacity-70">{selectedGuide.user.name} will confirm your session shortly.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!bookingSuccess && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-950/40 mb-2">Select Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950/20" />
                            <input 
                              type="date" 
                              value={bookingDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setBookingDate(e.target.value)}
                              className="w-full bg-sand-50 border border-sand-200 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-gold-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-950/40 mb-2">Duration (Hours)</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950/20" />
                            <select 
                              value={bookingHours}
                              onChange={(e) => setBookingHours(parseInt(e.target.value))}
                              className="w-full bg-sand-50 border border-sand-200 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-gold-500 appearance-none"
                            >
                              <option value={2}>2 Hours (Express)</option>
                              <option value={4}>4 Hours (Half Day)</option>
                              <option value={8}>8 Hours (Full Day)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-950/40 mb-2">Meeting Point</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950/20" />
                            <input 
                              type="text" 
                              value={bookingMeetingPoint}
                              onChange={(e) => setBookingMeetingPoint(e.target.value)}
                              placeholder="e.g. Virupaksha Temple Gate"
                              className="w-full bg-sand-50 border border-sand-200 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-gold-500"
                            />
                          </div>
                        </div>
                        <div className="p-6 bg-gold-50 rounded-2xl border border-gold-100">
                          <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-1">Estimated Cost</p>
                          <p className="text-2xl font-serif font-bold text-navy-950 italic">
                            ₹{(selectedGuide.pricePerDay * (bookingHours / 8)).toLocaleString()}
                          </p>
                          <p className="text-[9px] text-gold-700 font-bold mt-1">*Final price confirmed by expert</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleBookGuide}
                      disabled={isBooking || !bookingDate || !bookingMeetingPoint}
                      className="w-full h-16 rounded-[2rem] bg-navy-950 text-white text-lg font-bold shadow-luxury group overflow-hidden relative"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        {isBooking ? "Processing Request..." : "Confirm Booking Request"}
                        {!isBooking && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                      </span>
                      <div className="absolute inset-0 bg-gold-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    </Button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {!loading && filteredGuides.length === 0 && (
          <div className="text-center py-40">
            <h3 className="text-3xl font-serif font-bold text-navy-950 mb-4">No Experts Found</h3>
            <p className="text-navy-950/40 mb-8">Try searching for a different name or specialty.</p>
            <Button onClick={() => setSearchQuery("")} variant="outline" className="rounded-2xl">Clear Search</Button>
          </div>
        )}
      </section>

      {/* Join the Network CTA */}
      <section className="container mx-auto px-4 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gold-500 rounded-[3rem] p-12 md:p-20 relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-navy-950/10 rounded-full blur-3xl -ml-20 -mb-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center md:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-navy-950 text-white text-[10px] font-bold uppercase tracking-widest mb-6">
                For Local Experts
              </span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-navy-950 mb-6">
                Are you a <span className="italic">Guardian</span> of Hampi's history?
              </h2>
              <p className="text-navy-950/70 text-lg leading-relaxed mb-8">
                Join our elite network of storytellers. Reach a global audience of luxury travelers 
                and share the soul of Hampi with the world.
              </p>
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-navy-950" />
                  <span className="text-sm font-bold text-navy-950/80">Global Reach</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-navy-950" />
                  <span className="text-sm font-bold text-navy-950/80">Flexible Schedule</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-navy-950" />
                  <span className="text-sm font-bold text-navy-950/80">Premium Rates</span>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <Link to="/register">
                <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-navy-950 text-white text-xl font-bold shadow-2xl hover:scale-105 transition-all">
                  Join the Network
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust Banner */}
      <section className="bg-navy-950 py-24 text-white overflow-hidden relative">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="max-w-xl">
            <h2 className="text-4xl font-serif font-bold mb-6">Verified for <span className="text-gold-400">Excellence</span></h2>
            <p className="text-white/60 leading-relaxed mb-8">
              Every expert in our network undergoes a rigorous background check and must maintain 
              an active Archaeological Survey of India (ASI) certification.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-gold-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Licensed by ASI</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-gold-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Background Verified</span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex justify-center md:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gold-500 rounded-full blur-[100px] opacity-20" />
              <img 
                src="https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=2000" 
                className="w-80 h-80 object-cover rounded-[3rem] shadow-2xl rotate-3"
                alt="Hampi Heritage"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
