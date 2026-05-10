import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  Users, Calendar, MapPin, Star, Award, TrendingUp, Clock,
  ShieldCheck, Globe, Briefcase, IndianRupee, Plus, Trash2, Camera,
  CheckCircle2, Settings
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ProfileIncompleteBanner } from "../../components/shared/ProfileIncompleteBanner";

export function GuideDashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab") || "overview";

  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [guideServiceEnabled, setGuideServiceEnabled] = useState(true);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    bio: "",
    pricePerDay: "",
    pricePerHour: "",
    specialties: [] as string[],
    languages: [] as string[],
    idType: "",
    idNumber: "",
    idImage: ""
  });

  const [addingSpecialty, setAddingSpecialty] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [addingLanguage, setAddingLanguage] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");

  // Form State for new experience
  const [newExp, setNewExp] = useState({
    title: "",
    description: "",
    price: "",
    durationHours: "4",
    meetingPoint: "",
    includes: ["Expert Guiding", "Water Bottles"],
  });

  useEffect(() => {
    fetchProfile();
    fetchSystemStatus();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:5000/api/guides/profile/${user.id}`);
      const data = await res.json();
      setProfile(data);
      if (data) {
        setProfileForm({
          bio: data.bio || "",
          pricePerDay: data.pricePerDay?.toString() || "2500",
          pricePerHour: data.pricePerHour?.toString() || "500",
          specialties: data.specialties || [],
          languages: data.languages || [],
          idType: data.idType || "",
          idNumber: data.idNumber || "",
          idImage: data.idImage || ""
        });
        fetchBookings(data.id);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      console.log("Fetching system status for guide dashboard...");
      const res = await fetch("/api/settings");
      const data = await res.json();
      console.log("System status received:", data);
      setGuideServiceEnabled(data.guideServiceEnabled);
    } catch (err) {
      console.error("Failed to fetch system status in guide dashboard", err);
    }
  };

  const fetchBookings = async (profileId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/guides/${profileId}/bookings`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch(`http://localhost:5000/api/guides/profile/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (res.ok) {
        alert("Profile updated successfully!");
        fetchProfile();
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/guide-bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchBookings(profile.id);
      }
    } catch (err) {
      console.error("Failed to update booking status", err);
    }
  };

  const handleCreateExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/guides/${profile.id}/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExp)
      });
      if (res.ok) {
        setIsAddingExperience(false);
        fetchProfile();
        setNewExp({
          title: "",
          description: "",
          price: "",
          durationHours: "4",
          meetingPoint: "",
          includes: ["Expert Guiding", "Water Bottles"],
        });
      }
    } catch (err) {
      console.error("Failed to create experience", err);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm("Are you sure you want to delete this experience?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/experiences/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchProfile();
    } catch (err) {
      console.error("Failed to delete experience", err);
    }
  };

  const stats = [
    { label: "Total Tours", value: profile?.experiences?.length || "0", icon: MapPin, color: "bg-blue-50 text-blue-600" },
    { label: "Active Bookings", value: bookings.filter(b => b.status === 'CONFIRMED').length, icon: Calendar, color: "bg-gold-50 text-gold-600" },
    { label: "Avg Rating", value: profile?.rating?.toFixed(1) || "4.9", icon: Star, color: "bg-green-50 text-green-600" },
    { label: "Earnings", value: "₹" + (bookings.filter(b => b.status === 'CONFIRMED').reduce((acc, b) => acc + b.totalPrice, 0)).toLocaleString(), icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  ];

  const renderOverview = () => (
    <div className="space-y-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-sand-100 shadow-sm"
          >
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-navy-950/40 mb-1">{stat.label}</p>
            <p className="text-3xl font-serif font-bold text-navy-950">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-sand-100">
              <h2 className="text-2xl font-serif font-bold text-navy-950">Upcoming Bookings</h2>
              <p className="text-sm text-navy-950/40 mt-1">Your scheduled tours and requests.</p>
            </div>
            <div className="p-8 space-y-6">
              {bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] border border-sand-50 bg-sand-50/30 gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-sand-200 flex items-center justify-center text-navy-950 font-bold text-xl shadow-sm overflow-hidden">
                      {booking.user.avatar ? <img src={booking.user.avatar} className="w-full h-full object-cover" /> : booking.user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-navy-950">{booking.user.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-navy-950/40 font-medium">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gold-500" /> {new Date(booking.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gold-500" /> {booking.durationHours} hrs</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a href={`mailto:${booking.user.email}`}>
                      <Button variant="outline" size="sm" className="rounded-xl px-6">Message</Button>
                    </a>
                    {booking.status === 'PENDING' ? (
                      <>
                        <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'CANCELLED')} variant="outline" className="rounded-xl px-6 border-red-100 text-red-500 hover:bg-red-50">Decline</Button>
                        <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'CONFIRMED')} className="rounded-xl px-6 bg-green-600 hover:bg-green-700">Confirm</Button>
                      </>
                    ) : (
                      <span className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="text-center py-12 text-navy-950/30 italic">No upcoming bookings found.</div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-8">
            <h3 className="text-xl font-serif font-bold text-navy-950 mb-6">Expert Rating</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="text-5xl font-serif font-bold text-navy-950">{profile?.rating?.toFixed(1) || "4.9"}</div>
              <div>
                <div className="flex gap-1 text-gold-500 mb-1">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-xs text-navy-950/40 uppercase tracking-widest font-bold">{profile?.reviewCount || 48} reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTours = () => (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-navy-950">Signature Tour Packages</h2>
          <p className="text-sm text-navy-950/40 mt-1">Create and manage your unique Hampi experiences.</p>
        </div>
        <Button 
          onClick={() => setIsAddingExperience(true)}
          className="rounded-2xl shadow-luxury px-8 h-12 bg-navy-950 text-white hover:bg-gold-500 hover:text-navy-950 border-none transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> Create New Tour
        </Button>
      </div>

      <AnimatePresence>
        {isAddingExperience && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-[3rem] border-2 border-gold-500/20 shadow-2xl overflow-hidden mb-12"
          >
            <form onSubmit={handleCreateExperience} className="p-10 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Tour Title</label>
                    <input 
                      required
                      placeholder="e.g. The Architecture Marathon"
                      className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 px-6 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors"
                      value={newExp.title}
                      onChange={e => setNewExp({...newExp, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Description</label>
                    <textarea 
                      required
                      placeholder="Describe the journey and what guests will learn..."
                      className="w-full p-6 bg-sand-50 rounded-2xl border border-sand-100 min-h-[150px] font-medium text-navy-950 outline-none focus:border-gold-500 transition-colors resize-none"
                      value={newExp.description}
                      onChange={e => setNewExp({...newExp, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Price (INR)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950/40" />
                        <input 
                          required
                          type="number"
                          className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 pl-12 pr-4 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors"
                          value={newExp.price}
                          onChange={e => setNewExp({...newExp, price: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Duration (Hrs)</label>
                      <input 
                        required
                        type="number"
                        className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 px-6 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors"
                        value={newExp.durationHours}
                        onChange={e => setNewExp({...newExp, durationHours: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Meeting Point</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950/40" />
                      <input 
                        required
                        placeholder="e.g. Main Gate of Vittala Temple"
                        className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 pl-12 pr-4 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors"
                        value={newExp.meetingPoint}
                        onChange={e => setNewExp({...newExp, meetingPoint: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t border-sand-100">
                <Button type="button" variant="outline" onClick={() => setIsAddingExperience(false)} className="rounded-2xl px-8">Cancel</Button>
                <Button type="submit" className="rounded-2xl px-12 bg-navy-950 text-white shadow-luxury">Launch Experience</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profile?.experiences?.map((exp: any) => (
          <motion.div 
            key={exp.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white rounded-[2.5rem] border border-sand-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
          >
            <div className="h-48 bg-sand-100 relative">
              <div className="absolute inset-0 flex items-center justify-center text-sand-300">
                <Camera className="w-12 h-12" />
              </div>
              <button 
                onClick={() => handleDeleteExperience(exp.id)}
                className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-gold-50 text-gold-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {exp.durationHours} Hours
                </span>
                <span className="font-bold text-navy-950">₹{exp.price}</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-navy-950 mb-3">{exp.title}</h3>
              <p className="text-sm text-navy-950/50 line-clamp-2 leading-relaxed mb-6">{exp.description}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">
                <MapPin className="w-3 h-3" /> {exp.meetingPoint}
              </div>
            </div>
          </motion.div>
        ))}
        {(!profile?.experiences || profile.experiences.length === 0) && !isAddingExperience && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-sand-200">
            <Briefcase className="w-16 h-16 text-sand-200 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">No Signature Tours Yet</h3>
            <p className="text-navy-950/40 max-w-xs mx-auto mb-8">Productize your expertise by creating your first signature experience.</p>
            <Button onClick={() => setIsAddingExperience(true)} variant="outline" className="rounded-2xl border-navy-950 text-navy-950">Create First Tour</Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 space-y-10">
        <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-10">
          <h2 className="text-3xl font-serif font-bold text-navy-950 mb-8">Expert Profile Settings</h2>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Daily Rate (8 hrs)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950/40" />
                  <input 
                    type="number" 
                    value={profileForm.pricePerDay} 
                    onChange={e => setProfileForm({...profileForm, pricePerDay: e.target.value})}
                    className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 pl-12 pr-4 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors" 
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Hourly Rate</label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950/40" />
                  <input 
                    type="number" 
                    value={profileForm.pricePerHour} 
                    onChange={e => setProfileForm({...profileForm, pricePerHour: e.target.value})}
                    className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 pl-12 pr-4 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Professional Bio</label>
              <textarea 
                className="w-full p-6 bg-sand-50 rounded-2xl border border-sand-100 min-h-[150px] font-medium text-navy-950 outline-none focus:border-gold-500 transition-colors resize-none"
                value={profileForm.bio}
                onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1 flex items-center gap-2">
                  <Award className="w-3 h-3" /> Specialties
                </p>
                <div className="flex flex-wrap gap-2">
                  {profileForm.specialties.map((s: string) => (
                    <div key={s} className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-950 text-white text-xs font-bold transition-all hover:bg-gold-500 hover:text-navy-950">
                      {s}
                      <button 
                        onClick={() => setProfileForm({
                          ...profileForm, 
                          specialties: profileForm.specialties.filter(item => item !== s)
                        })}
                        className="p-0.5 hover:bg-white/20 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  {addingSpecialty ? (
                    <div className="flex items-center gap-2">
                      <input 
                        autoFocus
                        placeholder="Type specialty..."
                        className="h-9 px-4 bg-sand-50 rounded-xl border border-navy-200 text-xs font-bold text-navy-950 outline-none"
                        value={newSpecialty}
                        onChange={e => setNewSpecialty(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (newSpecialty) setProfileForm({...profileForm, specialties: [...profileForm.specialties, newSpecialty]});
                            setAddingSpecialty(false);
                            setNewSpecialty("");
                          }
                          if (e.key === 'Escape') setAddingSpecialty(false);
                        }}
                      />
                      <Button size="sm" onClick={() => {
                        if (newSpecialty) setProfileForm({...profileForm, specialties: [...profileForm.specialties, newSpecialty]});
                        setAddingSpecialty(false);
                        setNewSpecialty("");
                      }} className="h-9 px-3 rounded-xl">Add</Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAddingSpecialty(true)}
                      className="rounded-xl px-4 h-9 text-[10px] border-dashed border-navy-200"
                    >
                      Add specialty
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {profileForm.languages.map((l: string) => (
                    <div key={l} className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-50 border border-gold-200 text-gold-700 text-xs font-bold">
                      {l}
                      <button 
                        onClick={() => setProfileForm({
                          ...profileForm, 
                          languages: profileForm.languages.filter(item => item !== l)
                        })}
                        className="p-0.5 hover:bg-gold-200/50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  {addingLanguage ? (
                    <div className="flex items-center gap-2">
                      <input 
                        autoFocus
                        placeholder="Type language..."
                        className="h-9 px-4 bg-sand-50 rounded-xl border border-gold-200 text-xs font-bold text-gold-700 outline-none"
                        value={newLanguage}
                        onChange={e => setNewLanguage(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (newLanguage) setProfileForm({...profileForm, languages: [...profileForm.languages, newLanguage]});
                            setAddingLanguage(false);
                            setNewLanguage("");
                          }
                          if (e.key === 'Escape') setAddingLanguage(false);
                        }}
                      />
                      <Button size="sm" onClick={() => {
                        if (newLanguage) setProfileForm({...profileForm, languages: [...profileForm.languages, newLanguage]});
                        setAddingLanguage(false);
                        setNewLanguage("");
                      }} className="h-9 px-3 rounded-xl bg-gold-500 text-navy-950 hover:bg-gold-400">Add</Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setAddingLanguage(true)}
                      className="rounded-xl px-4 h-9 text-[10px] border-dashed border-gold-200"
                    >
                      Add language
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-sand-100 flex justify-end">
            <Button onClick={handleSaveProfile} isLoading={isSavingProfile} className="rounded-2xl px-12 h-14 shadow-luxury">Save Profile</Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-10">
        <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-8">
          <h3 className="text-xl font-serif font-bold text-navy-950 mb-6">Identity Verification</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Document Type</label>
              <select 
                value={profileForm.idType || ""} 
                onChange={e => setProfileForm({...profileForm, idType: e.target.value})}
                className="w-full h-12 bg-sand-50 rounded-xl border border-sand-100 px-4 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors appearance-none"
              >
                <option value="">Select ID Type</option>
                <option value="Aadhar Card">Aadhar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Voter ID">Voter ID</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">ID Number</label>
              <input 
                type="text"
                placeholder="Enter document number"
                value={profileForm.idNumber || ""}
                onChange={e => setProfileForm({...profileForm, idNumber: e.target.value})}
                className="w-full h-12 bg-sand-50 rounded-xl border border-sand-100 px-4 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Upload Document Photo</label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('image', file);
                    try {
                      const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: formData });
                      const data = await res.json();
                      setProfileForm({...profileForm, idImage: data.url});
                    } catch (err) { console.error("Upload failed", err); }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="h-32 rounded-2xl bg-sand-50 border-2 border-dashed border-sand-200 flex flex-center items-center justify-center overflow-hidden group-hover:border-gold-500 transition-colors">
                  {profileForm.idImage ? (
                    <img src={profileForm.idImage} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-sand-300 mx-auto mb-2" />
                      <span className="text-[10px] font-bold text-sand-400 uppercase tracking-widest">Click to upload</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-xl flex items-center gap-3 border ${
              profile?.status === 'APPROVED' ? 'bg-green-50 border-green-100 text-green-700' :
              profile?.status === 'PENDING' ? 'bg-gold-50 border-gold-100 text-gold-700' :
              'bg-sand-50 border-sand-100 text-navy-950/40'
            }`}>
              {profile?.status === 'APPROVED' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              <div className="text-xs">
                <p className="font-bold uppercase tracking-widest">Status: {profile?.status || 'Not Submitted'}</p>
                <p className="opacity-70 mt-0.5">
                  {profile?.status === 'APPROVED' ? 'Your identity is verified.' : 
                   profile?.status === 'PENDING' ? 'Waiting for admin review.' :
                   'Please provide ID to get verified.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-8">
          <h3 className="text-xl font-serif font-bold text-navy-950 mb-6">Certifications</h3>
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-4">
              <Award className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-green-900 text-sm">ASI Certified</p>
                <p className="text-[10px] text-green-700/70 mt-1 uppercase tracking-widest font-bold">Valid until 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">
      <div className="p-10 border-b border-sand-100 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-navy-950">Booking History</h2>
          <p className="text-sm text-navy-950/40 mt-1">Manage all your past and upcoming tour bookings.</p>
        </div>
      </div>
      <div className="p-10">
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] border border-sand-50 bg-sand-50/30 gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white border border-sand-200 flex items-center justify-center font-bold text-navy-950 overflow-hidden">
                  {booking.user.avatar ? <img src={booking.user.avatar} className="w-full h-full object-cover" /> : booking.user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-navy-950">{booking.user.name}</h4>
                  <p className="text-xs text-navy-950/40 font-medium">
                    {new Date(booking.date).toLocaleDateString()} • {booking.durationHours} Hours • ₹{booking.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                  booking.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-100' :
                  booking.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' :
                  'bg-gold-50 text-gold-700 border-gold-100'
                }`}>
                  {booking.status}
                </span>
                {booking.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'CANCELLED')} variant="outline" className="h-9 px-4 text-[10px] border-red-100 text-red-500">Reject</Button>
                    <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'CONFIRMED')} className="h-9 px-4 text-[10px] bg-green-600 text-white">Accept</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {bookings.length === 0 && (
            <div className="text-center py-20 bg-sand-50/50 rounded-[2rem] border-2 border-dashed border-sand-200">
              <Briefcase className="w-8 h-8 text-sand-300 mx-auto mb-4" />
              <p className="text-sm text-navy-950/40">Your booking history will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto bg-white rounded-[3rem] border border-sand-100 shadow-sm p-10">
      <h2 className="text-3xl font-serif font-bold text-navy-950 mb-10">Account Settings</h2>
      <Button 
        variant="outline" 
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
        className="w-full h-14 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 gap-2"
      >
        Sign Out of All Devices
      </Button>
    </div>
  );

  if (loading) return <div className="min-h-screen bg-sand-50 pt-28 flex items-center justify-center">Loading Expert Portal...</div>;

  return (
    <div className="min-h-screen bg-sand-50 pt-28 pb-20 px-4 md:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-100 text-navy-600 text-[10px] font-bold uppercase tracking-widest mb-4 shadow-sm"
            >
              <Award className="w-3 h-3" /> Hampi Expert Dashboard
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-950">
              Welcome back, <span className="text-gold-600">{user?.name.split(' ')[0]}</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/guide">
              <Button variant="outline" className="rounded-2xl border-sand-200 bg-white text-navy-950 hover:bg-sand-50 h-12 px-8 whitespace-nowrap">
                <Users className="w-4 h-4 mr-2" /> View Public Profile
              </Button>
            </Link>
            <Button 
              onClick={() => navigate("/dashboard?tab=profile")}
              className="rounded-2xl shadow-luxury h-12 px-8 bg-navy-950 text-white hover:bg-gold-500 hover:text-navy-950 border-none transition-all whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mr-2" /> Update Availability
            </Button>
          </div>
        </div>

        <ProfileIncompleteBanner />

        {/* Tab Navigation */}
        <nav className="flex items-center bg-white p-1.5 rounded-2xl border border-sand-200 shadow-sm mb-12 w-fit">
          {[
            { id: "overview", label: "Overview", icon: Award },
            { id: "tours", label: "Tours", icon: MapPin },
            { id: "bookings", label: "Bookings", icon: Calendar },
            { id: "profile", label: "Profile", icon: Users },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(`/dashboard?tab=${tab.id}`)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab.id 
                  ? "bg-navy-950 text-white shadow-lg" 
                  : "text-navy-950/40 hover:text-navy-950 hover:bg-sand-50"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* SERVICE SHUTDOWN ALERT */}
        <AnimatePresence>
          {!guideServiceEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-12 p-8 rounded-[3rem] bg-navy-950 text-white relative overflow-hidden border border-navy-800 shadow-2xl"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -ml-16 -mb-16" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 border border-white/20 flex items-center justify-center shrink-0 animate-pulse">
                  <ShieldCheck className="w-8 h-8 text-gold-400" />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-2xl font-serif font-bold mb-2">Service Maintenance in Progress</h3>
                  <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
                    The HampiStays expert network is currently undergoing administrative maintenance. During this period, your profile and experiences will be hidden from public discovery. Don't worry—your data is safe! We will notify you once the service is fully operational again.
                  </p>
                </div>
                <div className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Status: System Offline
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && renderOverview()}
            {activeTab === "tours" && renderTours()}
            {activeTab === "profile" && renderProfile()}
            {activeTab === "bookings" && renderBookings()}
            {activeTab === "settings" && renderSettings()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
