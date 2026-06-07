import { useModal } from "../../components/shared/ModalProvider";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  Users, Calendar, MapPin, Star, Award, TrendingUp, Clock,
  ShieldCheck, Globe, Briefcase, IndianRupee, Plus, Trash2, Camera,
  CheckCircle2, Settings, Loader2, LayoutDashboard, LogOut, Pencil
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ProfileIncompleteBanner } from "../../components/shared/ProfileIncompleteBanner";
import { useSystem } from "../../context/SystemContext";
import { useCurrency } from "../../context/CurrencyContext";
import { ErrorBoundary } from "../../components/shared/ErrorBoundary";
import { KycUploadSection } from "../../components/shared/KycUploadSection";
import { apiClient } from "../../utils/apiClient";
import { API_BASE_URL } from "../../config/api";
import { GuideChat } from "../../components/guide/GuideChat";
import { QrCode } from "lucide-react";

// Direct-to-Cloudinary Signed Upload Helper
async function uploadFile(file: File): Promise<string> {
  const token = localStorage.getItem('hampi-token');
  const sigRes = await fetch(`${API_BASE_URL}/upload/signature`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!sigRes.ok) {
    const errText = await sigRes.text();
    console.error('Signature fetch failed:', errText);
    throw new Error('Failed to get upload signature: ' + errText);
  }
  const sigData = await sigRes.json();
  
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sigData.api_key);
  fd.append('timestamp', sigData.timestamp);
  fd.append('signature', sigData.signature);
  fd.append('folder', sigData.folder);
  if (sigData.eager) {
    fd.append('eager', sigData.eager);
  }

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  
  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error("Cloudinary upload error:", errText);
    throw new Error('Cloudinary upload failed: ' + errText);
  }
  const data = await uploadRes.json();
  if (!data.secure_url) throw new Error('No URL returned');
  return data.secure_url;
}

export function GuideDashboard() {
  const { confirm, showModal } = useModal();

  const { user, logout, updateUser } = useAuth();
  const { formatPrice } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse path for routing instead of query params
  const pathParts = location.pathname.split('/');
  const subPath = pathParts[pathParts.length - 1];
  
  let activeTab = "overview";
  if (subPath === 'tours') activeTab = 'tours';
  if (subPath === 'calendar') activeTab = 'calendar';
  if (subPath === 'bookings-expert') activeTab = 'bookings';
  if (subPath === 'earnings') activeTab = 'payouts';
  if (subPath === 'expert-profile') activeTab = 'profile';
  if (subPath === 'kyc') activeTab = 'kyc';
  if (subPath === 'settings') activeTab = 'settings';
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [guideServiceEnabled, setGuideServiceEnabled] = useState(true);
  const { settings } = useSystem();
  const isIdRequired = settings?.verificationSettings?.guideRequirements 
    ? settings.verificationSettings.guideRequirements.some(req => !['EMAIL', 'PHONE'].includes(req))
    : true; // Default to true to be safe if settings are not loaded
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    bio: "",
    pricePerDay: "",
    pricePerHour: "",
    specialties: [] as string[],
    languages: [] as string[],
    idType: "",
    idNumber: "",
    idImage: "",
    avatar: ""
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
    maxGroupSize: "10",
    meetingPoint: "",
    inclusions: ["Expert Guiding", "Water Bottles"],
    exclusions: ["Entrance Fees", "Camera Fees"],
    imageUrl: "",
    imageUrl: "",
    isActive: true,
  });
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [isUploadingExpImage, setIsUploadingExpImage] = useState(false);
  const [uploadingExpId, setUploadingExpId] = useState<string | null>(null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  
  // Payouts & Bank State
  const [payouts, setPayouts] = useState<any[]>([]);
  const [bankForm, setBankForm] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifsc: ""
  });
  const [isSavingBank, setIsSavingBank] = useState(false);
  
  // Calendar State
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [bookingFilter, setBookingFilter] = useState("ALL");
  
  const [activeChatBooking, setActiveChatBooking] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
    fetchSystemStatus();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiClient.get<any>(`/guides/profile/${user.id}`);
      setProfile(data);
      if (data) {
        setBankForm({
          accountName: data.accountName || "",
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          ifsc: data.ifsc || ""
        });
        setAvatarPreview(data.user?.avatar || data.avatar || user?.avatar || "");
        setProfileForm({
          bio: data.bio || "",
          pricePerDay: data.pricePerDay?.toString() || "2500",
          pricePerHour: data.pricePerHour?.toString() || "500",
          specialties: data.specialties || [],
          languages: data.languages || [],
          idType: data.idType || "",
          idNumber: data.idNumber || "",
          idImage: data.idImage || "",
          avatar: data.user?.avatar || data.avatar || ""
        });
        fetchBookings(data.id);
        fetchPayouts(data.id);
        if (data.blockedDates) {
          setBlockedDates(data.blockedDates.map((d: string) => new Date(d).toISOString().split('T')[0]));
        }
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
      const data = await apiClient.get<any>('/settings');
      console.log("System status received:", data);
      setGuideServiceEnabled(data.guideServiceEnabled);
    } catch (err) {
      console.error("Failed to fetch system status in guide dashboard", err);
    }
  };

  const fetchBookings = async (profileId: string) => {
    try {
      const data = await apiClient.get<any>(`/guides/${profileId}/bookings`);
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  const fetchPayouts = async (profileId: string) => {
    try {
      const data = await apiClient.get<any[]>(`/guides/${profileId}/payouts`);
      setPayouts(data);
    } catch (err) {
      console.error("Failed to fetch payouts", err);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSavingBank(true);
    try {
      await apiClient.post(`/guides/${profile.id}/bank`, bankForm);
      toast.success("Bank details saved successfully!");
      fetchProfile();
      fetchPayouts(profile.id);
    } catch (err) {
      toast.error("Failed to save bank details.");
      console.error(err);
    } finally {
      setIsSavingBank(false);
    }
  };

  const toggleDateBlock = async (dateStr: string) => {
    if (!profile) return;
    const isBlocked = blockedDates.includes(dateStr);
    
    // Optimistic update
    if (isBlocked) {
      setBlockedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setBlockedDates(prev => [...prev, dateStr]);
    }
    
    try {
      if (isBlocked) {
        await apiClient.delete(`/guides/${profile.id}/calendar/block/${dateStr}`);
      } else {
        await apiClient.post(`/guides/${profile.id}/calendar/block`, { date: dateStr });
      }
      toast.success(isBlocked ? "Date unblocked" : "Date blocked");
    } catch (err) {
      // Revert on error
      if (isBlocked) {
        setBlockedDates(prev => [...prev, dateStr]);
      } else {
        setBlockedDates(prev => prev.filter(d => d !== dateStr));
      }
      toast.error("Failed to update availability");
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const updatedGuide = await apiClient.patch<any>(`/guides/profile/${user.id}`, {
        ...profileForm,
        name: user.name, // keep user name in sync
      });
      // Sync the user avatar/phone to AuthContext if they changed
      if (updatedGuide.user) {
        updateUser({
          ...user,
          avatar: updatedGuide.user.avatar || user.avatar,
          phone: updatedGuide.user.phone || user.phone,
        });
      }
      setShowSaveSuccess(true);
      toast.success("✓ Profile saved successfully!");
      setTimeout(() => setShowSaveSuccess(false), 4000);
      fetchProfile(); // Re-fetch to ensure UI is fully in sync with DB
    } catch (err) {
      console.error("Failed to update profile", err);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleBookingStatus = async (bookingId: string, status: string) => {
    try {
      await apiClient.patch(`/guide-bookings/${bookingId}/status`, { status });
      fetchBookings(profile?.id);
    } catch (err) {
      console.error("Failed to update booking status", err);
    }
  };

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newExp,
        price: parseFloat(newExp.price),
        durationHours: parseInt(newExp.durationHours, 10),
        maxGroupSize: parseInt(newExp.maxGroupSize, 10),
        images: newExp.imageUrl ? [newExp.imageUrl] : [] 
      };

      if (editingExpId) {
        await apiClient.patch(`/experiences/${editingExpId}`, payload);
        toast.success("Tour updated successfully!");
      } else {
        await apiClient.post(`/guides/${profile.id}/experiences`, payload);
        toast.success("Tour created successfully!");
      }
      
      setIsAddingExperience(false);
      setEditingExpId(null);
      fetchProfile();
      
      // Reset form
      setNewExp({
        title: "",
        description: "",
        price: "",
        durationHours: "4",
        maxGroupSize: "10",
        meetingPoint: "",
        inclusions: ["Expert Guiding", "Water Bottles"],
        exclusions: ["Entrance Fees", "Camera Fees"],
        imageUrl: "",
        isActive: true,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save tour.");
    }
  };

  const handleDeleteExperience = async (id: string) => {
    if (!(await confirm({ title: "Confirm Action", message: "Are you sure you want to delete this experience?" }))) return;
    try {
      await apiClient.delete(`/experiences/${id}`);
      fetchProfile();
    } catch (err) {
      console.error("Failed to delete experience", err);
    }
  };

  const stats = [
    { label: "Total Bookings", value: bookings.filter(b => b.status !== 'CANCELLED').length, icon: Briefcase, color: "bg-blue-50 text-blue-600" },
    { label: "Upcoming Tours", value: bookings.filter(b => b.status === 'CONFIRMED').length, icon: Calendar, color: "bg-gold-50 text-gold-600" },
    { label: "Avg Rating", value: profile?.rating?.toFixed(1) || "0.0", icon: Star, color: "bg-green-50 text-green-600" },
    { label: "Total Revenue", value: formatPrice(bookings.filter(b => b.status === 'COMPLETED').reduce((acc, b) => acc + (b.totalPrice * 0.9), 0)), icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  ];

  const renderOverview = () => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: d.toLocaleString('default', { month: 'short' }),
        monthNum: d.getMonth(),
        year: d.getFullYear(),
        inc: 0
      };
    });

    bookings.filter(b => b.status === 'COMPLETED').forEach(b => {
      const bDate = new Date(b.date);
      const match = last6Months.find(m => m.monthNum === bDate.getMonth() && m.year === bDate.getFullYear());
      if (match) match.inc += (b.totalPrice * 0.9);
    });

    const maxInc = Math.max(...last6Months.map(m => m.inc), 1000); // Prevent divide by 0
    const chartData = last6Months.map(m => ({
      month: m.month,
      val: Math.max(5, (m.inc / maxInc) * 100), // Base visual height
      inc: m.inc
    }));

    return (
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
            {/* Earnings Analytics */}
            <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-sand-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-navy-950">Earnings Analytics</h2>
                  <p className="text-sm text-navy-950/40 mt-1">Monthly performance and revenue growth.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-sand-50 rounded-xl border border-sand-100 text-[10px] font-bold text-navy-950 uppercase tracking-widest">
                  Last 6 Months <TrendingUp className="w-3 h-3 text-green-600" />
                </div>
              </div>
              <div className="p-10">
                <div className="flex items-end justify-between h-48 gap-4 px-4">
                  {chartData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-help">
                      <div className="w-full relative h-full flex items-end">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${d.val}%` }}
                          className="w-full bg-sand-100 rounded-2xl group-hover:bg-gold-500 transition-colors relative"
                        >
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-navy-950 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                            {formatPrice(d.inc)}
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">{d.month}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl px-6"
                      onClick={() => setActiveChatBooking(booking)}
                    >
                      Chat
                    </Button>
                    {booking.status === 'PENDING' ? (
                      <>
                        <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'CANCELLED')} variant="danger" className="rounded-xl px-6">Decline</Button>
                        <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'CONFIRMED')} variant="success" className="rounded-xl px-6">Confirm</Button>
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-serif font-bold text-navy-950">Expert Rating</h3>
              <Star className="w-5 h-5 text-gold-500 fill-current" />
            </div>
            <div className="flex items-center gap-4 mb-8">
              <div className="text-5xl font-serif font-bold text-navy-950">{profile?.rating?.toFixed(1) || "0.0"}</div>
              <div>
                <div className="flex gap-1 text-gold-500 mb-1">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current opacity-50" />)}
                </div>
                <p className="text-xs text-navy-950/40 uppercase tracking-widest font-bold">{profile?.reviewCount || 0} reviews</p>
              </div>
            </div>
            
            {/* Rating Breakdown */}
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(stars => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-navy-950/40 w-2">{stars}</span>
                  <div className="flex-1 h-1.5 bg-sand-50 rounded-full overflow-hidden border border-sand-100">
                    <div 
                      className="h-full bg-gold-500 rounded-full" 
                      style={{ width: `${stars === 5 ? 85 : stars === 4 ? 10 : 5}%` }} 
                    />
                  </div>
                  <span className="text-[10px] font-bold text-navy-950/40 w-8">{stars === 5 ? '85%' : stars === 4 ? '10%' : '5%'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Progress */}
          {profile?.status !== 'APPROVED' && (
            <div className="bg-navy-950 rounded-[3rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl" />
              <h4 className="text-lg font-serif font-bold mb-2">Verification Progress</h4>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-6">Status: {profile?.status}</p>
              <div className="space-y-4">
                {[
                  { label: "Profile Details", done: !!profile?.bio },
                  { label: "Identity Upload", done: !!profile?.idImage },
                  { label: "ASI Certificate", done: profile?.isVerified },
                  { label: "Admin Review", done: false }
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${step.done ? 'bg-gold-500 border-gold-500' : 'border-white/20'}`}>
                      {step.done && <CheckCircle2 className="w-3 h-3 text-navy-950" />}
                    </div>
                    <span className={`text-xs font-medium ${step.done ? 'text-white' : 'text-white/40'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                  {/* Cover Image Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Cover Image</label>
                    <div className="relative group/img cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingExpImage(true);
                          const fd = new FormData();
                          fd.append('image', file);
                          try {
                            const url = await uploadFile(file);
                            if (url) setNewExp(prev => ({ ...prev, imageUrl: url }));
                          } catch (err) { console.error("Image upload failed", err); }
                          finally { setIsUploadingExpImage(false); }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="h-44 rounded-2xl bg-sand-50 border-2 border-dashed border-sand-200 group-hover/img:border-gold-500 transition-colors overflow-hidden flex items-center justify-center">
                        {isUploadingExpImage ? (
                          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                        ) : newExp.imageUrl ? (
                          <img src={newExp.imageUrl} className="w-full h-full object-cover" alt="Tour cover" />
                        ) : (
                          <div className="text-center">
                            <Camera className="w-8 h-8 text-sand-300 mx-auto mb-2" />
                            <span className="text-[10px] font-bold text-sand-400 uppercase tracking-widest">Click to upload cover photo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
                      className="w-full p-6 bg-sand-50 rounded-2xl border border-sand-100 min-h-[120px] font-medium text-navy-950 outline-none focus:border-gold-500 transition-colors resize-none"
                      value={newExp.description}
                      onChange={e => setNewExp({...newExp, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Max Group Size</label>
                      <input 
                        required
                        type="number"
                        min="1"
                        className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 px-6 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors"
                        value={newExp.maxGroupSize}
                        onChange={e => setNewExp({...newExp, maxGroupSize: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Inclusions (comma separated)</label>
                      <input 
                        required
                        placeholder="e.g. Water, Guide"
                        className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 px-6 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors"
                        value={newExp.inclusions.join(', ')}
                        onChange={e => setNewExp({...newExp, inclusions: e.target.value.split(',').map(s => s.trim())})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Exclusions (comma separated)</label>
                      <input 
                        placeholder="e.g. Camera Fees, Lunch"
                        className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 px-6 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors"
                        value={newExp.exclusions.join(', ')}
                        onChange={e => setNewExp({...newExp, exclusions: e.target.value.split(',').map(s => s.trim())})}
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
                <Button type="button" variant="outline" onClick={() => { setIsAddingExperience(false); setEditingExpId(null); }} className="rounded-2xl px-8">Cancel</Button>
                <Button type="submit" className="rounded-2xl px-12 bg-navy-950 text-white shadow-luxury">{editingExpId ? "Save Changes" : "Create Tour"}</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {profile?.experiences?.length > 0 ? profile.experiences.map((exp: any) => (
          <motion.div 
            key={exp.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white rounded-[2.5rem] border border-sand-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
          >
            {/* Tour Cover Image with click-to-upload */}
            <div className="h-48 bg-sand-100 relative overflow-hidden">
              {exp.images?.[0] ? (
                <img src={exp.images[0]} className="w-full h-full object-cover" alt={exp.title} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sand-300">
                  <Camera className="w-10 h-10" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                </div>
              )}
              {/* Hover overlay: upload new image */}
              <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy-950/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingExpId(exp.id);
                    const fd = new FormData();
                    fd.append('image', file);
                    try {
                      const url = await uploadFile(file);
                      if (url) {
                        await apiClient.patch(`/experiences/${exp.id}`, { images: [url] });
                        fetchProfile(); // Refresh to show new image
                      }
                    } catch (err) { console.error("Image upload failed", err); }
                    finally { setUploadingExpId(null); }
                  }}
                />
                {uploadingExpId === exp.id ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <>
                    <Camera className="w-7 h-7 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                      {exp.images?.[0] ? 'Change Photo' : 'Upload Photo'}
                    </span>
                  </>
                )}
              </label>
              {/* Edit button */}
              <button 
                onClick={() => {
                  setEditingExpId(exp.id);
                  setNewExp({
                    title: exp.title,
                    description: exp.description,
                    price: exp.price.toString(),
                    durationHours: exp.durationHours.toString(),
                    maxGroupSize: (exp.maxGroupSize || 10).toString(),
                    meetingPoint: exp.meetingPoint,
                    inclusions: exp.inclusions || [],
                    exclusions: exp.exclusions || [],
                    imageUrl: exp.images?.[0] || "",
                    isActive: exp.isActive,
                  });
                  setIsAddingExperience(true);
                }}
                className="absolute top-4 right-16 p-3 bg-white/90 backdrop-blur-md rounded-xl text-navy-950 opacity-0 group-hover:opacity-100 transition-all hover:bg-gold-50 hover:text-gold-700 z-20"
              >
                <Pencil className="w-5 h-5" />
              </button>
              {/* Delete button */}
              <button 
                onClick={() => handleDeleteExperience(exp.id)}
                className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-700 z-20"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-gold-50 text-gold-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {exp.durationHours} Hours • Max {exp.maxGroupSize || 10}
                </span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        await apiClient.patch(`/experiences/${exp.id}`, { isActive: !exp.isActive });
                        fetchProfile();
                      } catch (err) { console.error(err); }
                    }}
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${exp.isActive ? 'border-green-200 bg-green-50 text-green-600' : 'border-sand-200 bg-sand-50 text-navy-950/40'}`}
                  >
                    {exp.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <span className="font-bold text-navy-950">{formatPrice(exp.price)}</span>
                </div>
              </div>
              <h3 className="text-xl font-serif font-bold text-navy-950 mb-3">{exp.title}</h3>
              <p className="text-sm text-navy-950/50 line-clamp-2 leading-relaxed mb-4">{exp.description}</p>
              
              <div className="space-y-2 mb-6">
                {(exp.inclusions && exp.inclusions.length > 0) && (
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                    + {exp.inclusions.slice(0,2).join(', ')}{exp.inclusions.length > 2 ? '...' : ''}
                  </div>
                )}
                {(exp.exclusions && exp.exclusions.length > 0) && (
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                    - {exp.exclusions.slice(0,2).join(', ')}{exp.exclusions.length > 2 ? '...' : ''}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold text-navy-950/30 uppercase tracking-widest">
                <MapPin className="w-3 h-3" /> {exp.meetingPoint}
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-sand-200">
            <Briefcase className="w-16 h-16 text-sand-200 mx-auto mb-6" />
            <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">No Signature Tours Yet</h3>
            <p className="text-navy-950/40 max-w-xs mx-auto mb-8">Productize your expertise by creating your first signature experience.</p>
            <Button onClick={() => setIsAddingExperience(true)} variant="outline" className="rounded-2xl border-navy-950 text-navy-950">Create First Tour</Button>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {activeChatBooking && (
          <GuideChat 
            bookingId={activeChatBooking.id}
            guideName={profile?.user?.name || "Me"}
            travellerName={activeChatBooking.user.name}
            onClose={() => setActiveChatBooking(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );

  const renderProfile = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 space-y-10">
        <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-10">
          <h2 className="text-3xl font-serif font-bold text-navy-950 mb-8">Expert Profile Settings</h2>
          
          <div className="space-y-8">
            {/* Profile Image Upload */}
            <div className="flex flex-col md:flex-row gap-6 items-center bg-sand-50/50 p-6 rounded-3xl border border-sand-100">
              <div className="relative group shrink-0 w-24 h-24">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    setIsUploadingAvatar(true);
                    const formData = new FormData();
                    formData.append('image', file);
                    try {
                      const url = await uploadFile(file);
                      if (!url) throw new Error('Upload failed');

                      // 2. Save avatar URL immediately to the User record
                      await apiClient.patch(`/users/${user.id}`, { avatar: url });

                      // 3. Update AuthContext so image shows everywhere instantly
                      updateUser({ ...user, avatar: url });

                      // 4. Update dedicated preview state — this triggers re-render immediately
                      setAvatarPreview(url);

                      // 5. Update local form state too
                      setProfileForm(prev => ({...prev, avatar: url}));
                      toast.success("Profile photo updated!");
                    } catch (err) {
                      console.error("Avatar upload failed", err);
                      toast.error("Failed to upload photo. Please try again.");
                    } finally {
                      setIsUploadingAvatar(false);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-24 h-24 rounded-full bg-white border-2 border-dashed border-sand-200 flex items-center justify-center overflow-hidden group-hover:border-gold-500 transition-colors shadow-sm">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-7 h-7 text-gold-500 animate-spin" />
                  ) : avatarPreview ? (
                    <img src={avatarPreview} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <Camera className="w-8 h-8 text-sand-300" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gold-500 text-navy-950 rounded-full flex items-center justify-center shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="font-bold text-navy-950">Profile Picture</h3>
                <p className="text-xs text-navy-950/40 mt-1">A professional photo helps build trust with luxury travelers.</p>
              </div>
            </div>
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
                  {(profileForm.specialties || []).map((s: string) => (
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
                  {(profileForm.languages || []).map((l: string) => (
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

          <div className="mt-12 pt-8 border-t border-sand-100 flex justify-end items-center gap-4">
            <AnimatePresence>
              {showSaveSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2.5 rounded-xl border border-green-100"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Saved Successfully</span>
                </motion.div>
              )}
            </AnimatePresence>
            <Button onClick={handleSaveProfile} isLoading={isSavingProfile} className="rounded-2xl px-12 h-14 shadow-luxury">Save Profile</Button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-10">

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

  const renderBookings = () => {
    const filteredBookings = bookings.filter(b => bookingFilter === 'ALL' || b.status === bookingFilter);

    return (
      <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-sand-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-navy-950">Booking History</h2>
            <p className="text-sm text-navy-950/40 mt-1">Manage all your past and upcoming tour bookings.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(filter => (
              <button
                key={filter}
                onClick={() => setBookingFilter(filter)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  bookingFilter === filter 
                    ? 'bg-navy-950 text-white' 
                    : 'bg-sand-50 text-navy-950/60 hover:bg-sand-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="p-10">
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] border border-sand-50 bg-sand-50/30 gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-sand-200 flex items-center justify-center font-bold text-navy-950 overflow-hidden shrink-0">
                    {booking.user?.avatar ? <img src={booking.user.avatar} className="w-full h-full object-cover" /> : booking.user?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy-950">{booking.user?.name || 'Unknown Traveler'}</h4>
                    <p className="text-xs text-navy-950/40 font-medium">
                      {new Date(booking.date).toLocaleDateString()} • {booking.durationHours} Hours • {formatPrice(booking.totalPrice)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap justify-end">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                    booking.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-100' :
                    booking.status === 'COMPLETED' ? 'bg-navy-50 text-navy-700 border-navy-100' :
                    booking.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' :
                    'bg-gold-50 text-gold-700 border-gold-100'
                  }`}>
                    {booking.status}
                  </span>
                  
                  {booking.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'CANCELLED')} variant="danger" className="h-9 px-4 text-[10px]">Reject</Button>
                      <Button size="sm" onClick={() => handleBookingStatus(booking.id, 'CONFIRMED')} variant="success" className="h-9 px-4 text-[10px]">Accept</Button>
                    </div>
                  )}

                  {booking.status === 'CONFIRMED' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleBookingStatus(booking.id, 'CHECKED_IN')} 
                      className="h-9 px-4 text-[10px] bg-navy-950 text-white shadow-luxury hover:bg-gold-500 hover:text-navy-950"
                    >
                      <QrCode className="w-3 h-3 mr-2" />
                      Scan QR Pass (Check In)
                    </Button>
                  )}

                  {booking.status === 'CHECKED_IN' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleBookingStatus(booking.id, 'COMPLETED')} 
                      className="h-9 px-4 text-[10px] border border-navy-950 text-navy-950 hover:bg-navy-50"
                    >
                      Complete Tour
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredBookings.length === 0 && (
              <div className="text-center py-20 bg-sand-50/50 rounded-[2rem] border-2 border-dashed border-sand-200">
                <Briefcase className="w-8 h-8 text-sand-300 mx-auto mb-4" />
                <p className="text-sm text-navy-950/40">No {bookingFilter !== 'ALL' ? bookingFilter.toLowerCase() : ''} bookings found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    const { currency, setCurrency } = useCurrency();
    
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-[3rem] border border-sand-100 shadow-sm p-10">
        <h2 className="text-3xl font-serif font-bold text-navy-950 mb-10">Account Settings</h2>
        
        <div className="space-y-8 mb-10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Display Currency</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-950/40" />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD' | 'EUR' | 'GBP')}
                className="w-full h-14 bg-sand-50 rounded-2xl border border-sand-100 pl-12 pr-4 font-bold text-navy-950 outline-none focus:border-gold-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
                <option value="GBP">£ British Pound (GBP)</option>
              </select>
            </div>
            <p className="text-xs text-navy-950/40 ml-1">Choose how prices are displayed across your dashboard.</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
          className="w-full h-14 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200 gap-2"
        >
          Sign Out of All Devices
        </Button>
      </div>
    );
  };

  const renderPayouts = () => {
    const totalEarnings = bookings.filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED').reduce((acc, b) => acc + b.totalPrice, 0);
    const platformCommission = totalEarnings * 0.1; // 10% mock commission
    const netEarnings = totalEarnings - platformCommission;
    
    // Masked Account Number
    const maskedAccount = bankForm.accountNumber ? `XXXX-XXXX-${bankForm.accountNumber.slice(-4)}` : "";

    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-sand-100 shadow-sm">
            <p className="text-sm font-medium text-navy-950/40 mb-1">Gross Earnings</p>
            <p className="text-3xl font-serif font-bold text-navy-950">{formatPrice(totalEarnings)}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-sand-100 shadow-sm">
            <p className="text-sm font-medium text-navy-950/40 mb-1">Platform Commission (10%)</p>
            <p className="text-3xl font-serif font-bold text-red-500">-{formatPrice(platformCommission)}</p>
          </div>
          <div className="bg-gold-50 p-8 rounded-[2.5rem] border border-gold-200 shadow-sm">
            <p className="text-sm font-medium text-gold-700 mb-1">Net Earnings</p>
            <p className="text-3xl font-serif font-bold text-gold-700">{formatPrice(netEarnings)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-sand-100">
                <h3 className="text-xl font-serif font-bold text-navy-950">Transaction Ledger</h3>
              </div>
              <div className="p-8 space-y-4">
                {payouts.filter(p => p.status !== 'BANK_INFO').length > 0 ? payouts.filter(p => p.status !== 'BANK_INFO').map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-sand-50/50 border border-sand-100">
                    <div>
                      <p className="font-bold text-navy-950">Payout - {p.ref || p.id.slice(-6)}</p>
                      <p className="text-[10px] uppercase tracking-widest text-navy-950/40 font-bold mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${p.status === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}>+{formatPrice(p.amount)}</p>
                      <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${
                        p.status === 'PAID' ? 'text-green-600' : 
                        p.status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
                      }`}>{p.status}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-navy-950/40">No transactions yet.</div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-8">
              <h3 className="text-xl font-serif font-bold text-navy-950 mb-6">Payout Bank Details</h3>
              <form onSubmit={handleSaveBank} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Account Holder Name</label>
                  <input 
                    required
                    value={bankForm.accountName}
                    onChange={e => setBankForm({...bankForm, accountName: e.target.value})}
                    className="w-full h-12 bg-sand-50 rounded-xl border border-sand-100 px-4 font-bold text-navy-950 outline-none focus:border-gold-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Bank Name</label>
                  <input 
                    required
                    value={bankForm.bankName}
                    onChange={e => setBankForm({...bankForm, bankName: e.target.value})}
                    className="w-full h-12 bg-sand-50 rounded-xl border border-sand-100 px-4 font-bold text-navy-950 outline-none focus:border-gold-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">Account Number</label>
                  <input 
                    required
                    type="password"
                    placeholder={maskedAccount || "Account Number"}
                    value={bankForm.accountNumber}
                    onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})}
                    className="w-full h-12 bg-sand-50 rounded-xl border border-sand-100 px-4 font-bold text-navy-950 outline-none focus:border-gold-500"
                  />
                  {maskedAccount && !bankForm.accountNumber && (
                    <p className="text-[10px] text-green-600 mt-1 ml-1 font-bold">Currently saved: {maskedAccount}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-navy-950/40 ml-1">IFSC Code</label>
                  <input 
                    required
                    value={bankForm.ifsc}
                    onChange={e => setBankForm({...bankForm, ifsc: e.target.value})}
                    className="w-full h-12 bg-sand-50 rounded-xl border border-sand-100 px-4 font-bold text-navy-950 outline-none focus:border-gold-500 uppercase"
                  />
                </div>
                <Button type="submit" isLoading={isSavingBank} className="w-full mt-6 rounded-xl bg-navy-950 text-white shadow-luxury">
                  Save Bank Details
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return (
      <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-navy-950 mb-2">Availability Calendar</h2>
            <p className="text-sm text-navy-950/40">Manage your working days. Block dates you are unavailable.</p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="rounded-xl"
            >
              Previous
            </Button>
            <span className="text-lg font-bold text-navy-950 py-2">{monthName}</span>
            <Button 
              variant="outline" 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="rounded-xl"
            >
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-navy-950/40 text-[10px] uppercase tracking-widest">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-4">
          {days.map((date, i) => {
            if (!date) return <div key={i} className="aspect-square bg-sand-50/30 rounded-2xl" />;
            
            // Generate local YYYY-MM-DD securely to avoid timezone shifts
            const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const isBlocked = blockedDates.includes(dateStr);
            const isPast = date < new Date(new Date().setHours(0,0,0,0));
            const dayBookings = bookings.filter(b => b.date.startsWith(dateStr) && b.status !== 'CANCELLED');
            
            return (
              <button
                key={i}
                disabled={isPast}
                onClick={() => toggleDateBlock(dateStr)}
                className={`aspect-square p-2 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all relative group
                  ${isPast ? 'opacity-50 cursor-not-allowed bg-sand-50' : 
                    isBlocked ? 'bg-red-50 hover:bg-red-100 border border-red-200' : 
                    dayBookings.length > 0 ? 'bg-navy-900 text-white hover:bg-navy-950' : 'bg-sand-50 hover:bg-sand-100 border border-sand-200'}
                `}
              >
                <span className={`font-bold ${dayBookings.length > 0 && !isBlocked ? 'text-white' : 'text-navy-950'}`}>
                  {date.getDate()}
                </span>
                
                {isBlocked && <span className="text-[10px] font-bold text-red-500">BLOCKED</span>}
                {!isBlocked && dayBookings.length > 0 && (
                  <span className="text-[10px] font-bold text-gold-400">{dayBookings.length} Tour{dayBookings.length > 1 ? 's' : ''}</span>
                )}
                
                {/* Hover state for available dates */}
                {!isPast && !isBlocked && dayBookings.length === 0 && (
                  <span className="text-[10px] font-bold text-navy-950/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    Block
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-sand-50/50 pt-28 flex items-center justify-center">Loading Expert Portal...</div>;

  return (
    <div className="min-h-screen bg-sand-50/50 flex flex-col pt-12">
      {/* Main Content (No Sidebar) */}
      <main className="flex-1 pb-12 px-4 md:px-10 max-w-6xl mx-auto w-full">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-navy-100 text-navy-600 text-[10px] font-bold uppercase tracking-widest mb-2 shadow-sm"
            >
              <Award className="w-3 h-3" /> Hampi Expert Dashboard
            </motion.div>
            <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">
              Welcome back, <span className="text-gold-600 italic">{(user?.name || "Guide").split(' ')[0]}</span>
            </h1>
            <p className="text-navy-950/50 font-medium">Manage your tours, availability, and guest experiences.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/guide">
              <Button variant="outline" className="rounded-xl border-sand-200 bg-white text-navy-950 hover:bg-sand-50 h-11 px-6 whitespace-nowrap">
                <Globe className="w-4 h-4 mr-2" /> View Public Profile
              </Button>
            </Link>
            <Button 
              onClick={() => navigate("/dashboard?tab=calendar")}
              className="rounded-xl shadow-luxury h-11 px-6 bg-navy-950 text-white hover:bg-gold-500 hover:text-navy-950 border-none transition-all whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mr-2" /> Update Availability
            </Button>
          </div>
        </header>

        <ProfileIncompleteBanner />

        {/* SERVICE SHUTDOWN ALERT */}
        <AnimatePresence>
          {!guideServiceEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-12 p-8 rounded-[2rem] bg-gradient-to-r from-navy-950 to-navy-900 text-white relative overflow-hidden border border-gold-900/30 shadow-luxury"
            >
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 mix-blend-screen" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 mix-blend-screen" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 border border-white/20 flex items-center justify-center shrink-0 animate-pulse">
                  <ShieldCheck className="w-8 h-8 text-gold-400" />
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-xl font-serif font-bold mb-2 text-white">Service Maintenance in Progress</h3>
                  <p className="text-sand-200 text-sm leading-relaxed max-w-2xl font-medium">
                    The HampiStays expert network is currently undergoing administrative maintenance. During this period, your profile and experiences will be hidden from public discovery. Don't worry—your data is safe! We will notify you once the service is fully operational again.
                  </p>
                </div>
                <div className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 shrink-0">
                  Status: System Offline
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <AnimatePresence>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ErrorBoundary fallback={<div className="p-10 text-center text-red-500 bg-red-50 rounded-[2rem]">Failed to load this section. Please try again.</div>}>
              {activeTab === "overview" && renderOverview()}
              {activeTab === "tours" && renderTours()}
              {activeTab === "profile" && renderProfile()}
              {activeTab === "kyc" && (
                <KycUploadSection userType="guide" profileId={profile?.id} />
              )}
              {activeTab === "payouts" && renderPayouts()}
              {activeTab === "calendar" && renderCalendar()}
              {activeTab === "bookings" && renderBookings()}
              {activeTab === "settings" && renderSettings()}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
}
