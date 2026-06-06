import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Heart, User, LogOut, 
  ChevronRight, MapPin, Star, Check,
  LayoutDashboard, ShoppingBag, Bell, Mail,
  Phone, Compass, Shield, Download, Smartphone, Share,
  Copy, CheckCircle, Gift, Landmark, Sun, Sunrise, Sunset, Thermometer, Cloud
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";
import { ProfileIncompleteBanner } from "../../components/shared/ProfileIncompleteBanner";
import { apiClient } from "../../utils/apiClient";
import toast from "react-hot-toast";
import type { Booking, Message } from "../../types/booking";
import type { Resort } from "../../types/resort";
import { KycUploadSection } from "../../components/shared/KycUploadSection";
import { useSystem } from "../../context/SystemContext";


export function TravelerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useSystem();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<Resort[]>([]); // TODO: Define Wishlist interface if needed
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeMessageBooking, setActiveMessageBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showStayPassModal, setShowStayPassModal] = useState<Booking | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [promoSettings, setPromoSettings] = useState<any>(null);
  const [hasGuideBooking, setHasGuideBooking] = useState(false);
  const [recommendedGuides, setRecommendedGuides] = useState<any[]>([]);
  const [activePromotions, setActivePromotions] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [hideKycBanner, setHideKycBanner] = useState(sessionStorage.getItem('hideKycBanner') === 'true');
  const [referralData, setReferralData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [bookingsData, wishlistData, notificationsData, activePromos, referralRes] = await Promise.all([
          apiClient.get<Booking[]>(`/users/bookings`),
          apiClient.get<any[]>(`/users/${user.id}/wishlist`),
          apiClient.get<any[]>(`/users/notifications`).catch(() => []),
          apiClient.get<any[]>(`/promotions/active`).catch(() => []),
          apiClient.get<any>(`/referrals/dashboard`).catch(() => null)
        ]);

        if (referralRes && referralRes.data) {
          setReferralData(referralRes.data);
        }

        const normalizedWishlist = (wishlistData || []).map((r: any) => ({
          ...r,
          location: {
            area: r.locationArea || "Hampi",
            district: "Hampi",
            state: "Karnataka",
            lat: r.locationLat || 15.3350,
            lng: r.locationLng || 76.4600,
            distanceFromCenterKm: 5
          }
        })) as Resort[];

        setBookings(bookingsData);
        setWishlist(normalizedWishlist);
        setActivePromotions(activePromos || []);
        
        try {
          const viewed = JSON.parse(localStorage.getItem('recentlyViewedResorts') || '[]');
          setRecentlyViewed(viewed.slice(0, 3));
        } catch(e) {}
        if (notificationsData) {
          setUnreadCount(notificationsData.filter((n: any) => !n.isRead).length);
        }

        try {
          const promoData = await apiClient.get<any>('/users/guide-promotion-settings');
          setPromoSettings(promoData);
          if (promoData?.enableRecommendations) {
            // Track impression if banner will be shown
            const upcoming = bookingsData[0];
            if (upcoming && promoData?.enableDashboardBanner) {
               const checkInDate = new Date(upcoming.checkIn);
               const daysUntil = (checkInDate.getTime() - Date.now()) / (1000 * 3600 * 24);
               if (daysUntil <= 30) {
                 apiClient.post('/users/guide-promotion-analytics/track', { type: 'impression' }).catch(()=>{});
                 
                 // Fetch recommended guides for this date range
                 const cIn = upcoming.checkIn;
                 const cOut = upcoming.checkOut;
                 apiClient.get<any[]>(`/guides/recommended?checkIn=${cIn}&checkOut=${cOut}`)
                   .then(guides => setRecommendedGuides(guides || []))
                   .catch(() => {});
               }
            }
          }
        } catch (e) {
          console.error('Failed to fetch promo settings', e);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Real-time sync listener
    const handleWishlistUpdate = () => {
      if (!user) return;
      apiClient.get<any[]>(`/users/${user.id}/wishlist`)
        .then(data => {
          const normalized = (data || []).map((r: any) => ({
            ...r,
            location: {
              area: r.locationArea || "Hampi",
              district: "Hampi",
              state: "Karnataka",
              lat: r.locationLat || 15.3350,
              lng: r.locationLng || 76.4600,
              distanceFromCenterKm: 5
            }
          })) as Resort[];
          setWishlist(normalized);
        })
        .catch(err => console.error("Real-time wishlist sync failed:", err));
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, [user]);

  // Helper: local storage fallback database
  const getLocalMessages = (bookingId: string): Message[] => {
    const key = `hampistays-chat-${bookingId}`;
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local);

    const initialMsgs: Message[] = [
      {
        id: "init-" + bookingId,
        text: `Welcome! I am your personal concierge for your upcoming majestic stay at ${activeMessageBooking?.resort?.name || "our sanctuary"}. Let me know if you need contactless check-in instructions, custom dining arrangements, or guide recommendations for exploring the ancient Hampi ruins. ✨`,
        senderId: "host",
        bookingId,
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      }
    ];
    localStorage.setItem(key, JSON.stringify(initialMsgs));
    return initialMsgs;
  };

  const saveLocalMessage = (bookingId: string, msg: Message) => {
    const key = `hampistays-chat-${bookingId}`;
    const current = getLocalMessages(bookingId);
    const updated = [...current, msg];
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'inbox' && activeMessageBooking) {
      // Instantly load local cache so there's zero lag or blank screen
      setMessages(getLocalMessages(activeMessageBooking.id));

      const fetchMessages = async () => {
        try {
          const data = await apiClient.get<Message[]>(`/messages/${activeMessageBooking.id}`);
          if (data && data.length > 0) {
            setMessages(data);
            localStorage.setItem(`hampistays-chat-${activeMessageBooking.id}`, JSON.stringify(data));
          }
        } catch (err) {
          console.log("Using cached local fallback messages channel.");
        }
      };
      fetchMessages();
      interval = setInterval(fetchMessages, 7000);
    }
    return () => clearInterval(interval);
  }, [activeTab, activeMessageBooking]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeMessageBooking) return;
    
    const userMsgText = newMessage;
    setNewMessage("");

    // Create traveler message object
    const travelerMsg: Message = {
      id: "traveler-" + Date.now(),
      text: userMsgText,
      senderId: user?.id || "guest",
      bookingId: activeMessageBooking.id,
      createdAt: new Date().toISOString()
    };

    // Prepend user message locally
    const updatedMsgs = saveLocalMessage(activeMessageBooking.id, travelerMsg);
    setMessages(updatedMsgs);

    // Try posting to backend, fail silently (handled by cache sync)
    try {
      await apiClient.post<Message>('/messages', {
        text: userMsgText,
        senderId: user?.id,
        bookingId: activeMessageBooking.id
      });
    } catch (error) {
      console.log("Saved message to secure client cache.");
    }

    // Trigger Concierge Response after brief delay
    setIsTyping(true);
    setTimeout(() => {
      let conciergeReplyText = "";
      const textLower = userMsgText.toLowerCase();

      if (textLower.includes("check") || textLower.includes("arrive") || textLower.includes("time") || textLower.includes("pass")) {
        conciergeReplyText = `We are absolutely delighted to host you! Your luxury stay pass is fully confirmed and active. Our private resort buggy will be waiting for you near the heritage entry archways. Let us know if you would like to arrange check-in at a specific time! 🚗`;
      } else if (textLower.includes("food") || textLower.includes("dinner") || textLower.includes("eat") || textLower.includes("menu") || textLower.includes("restaurant") || textLower.includes("meal")) {
        conciergeReplyText = `Our culinary master chefs offer both stellar global cuisines and organic Vijayanagara heritage recipes. We have reserved our best garden table for you. Let us know if we should curate a special wellness meal plan! 🍽️`;
      } else if (textLower.includes("tour") || textLower.includes("ruin") || textLower.includes("guide") || textLower.includes("visit") || textLower.includes("places")) {
        conciergeReplyText = `Hampi is a timeless wonder! We highly recommend viewing the sun rising over Matanga Hill, followed by a personalized chariot-path tour of the Vitthala Temple complex. Our registered heritage guide is ready to accompany you! 🌅`;
      } else {
        conciergeReplyText = `That sounds magnificent! I have updated our hospitality front desk with your request. Is there anything else we can prepare to make your retreat absolutely perfect? ✨`;
      }

      const hostMsg: Message = {
        id: "host-" + Date.now(),
        text: conciergeReplyText,
        senderId: "host",
        bookingId: activeMessageBooking.id,
        createdAt: new Date().toISOString()
      };

      const withHost = saveLocalMessage(activeMessageBooking.id, hostMsg);
      setMessages(withHost);
      setIsTyping(false);

      // Attempt to persist concierge response in database
      apiClient.post<Message>('/messages', {
        text: conciergeReplyText,
        senderId: "host",
        bookingId: activeMessageBooking.id
      }).catch(() => {});
    }, 2000);
  };



  const upcomingCount = bookings.filter(b => ['PENDING', 'PAID', 'CONFIRMED'].includes(b.status)).length;
  const completedCount = bookings.filter(b => ['COMPLETED', 'CHECKED_IN'].includes(b.status)).length;
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length;

  const travellerKycReqs = settings?.verificationSettings?.travellerRequirements || [];
  // Exclude non-document reqs for KYC tab visibility (e.g., EMAIL, PHONE)
  const hasKycRequirements = travellerKycReqs.some(r => !['EMAIL', 'PHONE'].includes(r));

  const quickActions = [
    { label: "Browse Resorts", icon: Compass, link: "/resorts", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "View Saved", icon: Heart, link: "/dashboard/wishlist", color: "text-red-500", bg: "bg-red-50" },
    { label: "Contact Support", icon: Phone, action: () => window.location.href='mailto:support@hampistays.com', color: "text-gold-600", bg: "bg-gold-50" },
    { label: "Download Invoice", icon: Download, link: "/dashboard/bookings", color: "text-green-600", bg: "bg-green-50" },
  ];

  const upcomingTrip = bookings[0] ? {
    resortName: bookings[0].resort?.name || "Resort",
    dates: `${new Date(bookings[0].checkIn).toLocaleDateString()} - ${new Date(bookings[0].checkOut).toLocaleDateString()}`,
    status: "Confirmed",
    image: bookings[0].resort?.images?.[0] || "https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=1000",
    location: bookings[0].resort?.locationArea || "Hampi",
  } : null;

  return (
    <div className="min-h-screen bg-sand-50/50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-sand-200 hidden md:flex flex-col sticky top-0 h-screen pt-24 pb-8">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 p-3 bg-sand-50 rounded-2xl border border-sand-100">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy-950 to-navy-800 flex items-center justify-center text-white overflow-hidden shadow-sm border border-sand-200/50">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold tracking-tighter">
                  {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || "H"}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-navy-950">{user?.name || "Guest"}</p>
              <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">
                {user?.role === "RESORT_OWNER" ? "Resort Owner" : "Traveller"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-grow px-4 space-y-1">
          {[
            { name: "Overview", icon: LayoutDashboard, id: "overview" },
            { name: "Book Stays", icon: Calendar, path: "/resorts" },
            { name: "My Bookings", icon: ShoppingBag, path: "/dashboard/bookings" },
            { name: "Guest Inbox", icon: Mail, id: "inbox" },
            ...(hasKycRequirements ? [{ name: "KYC & Verification", icon: Shield, id: "kyc" }] : []),
            { name: "Notifications", icon: Bell, path: "/dashboard/notifications", badge: unreadCount },
            { name: "Profile", icon: User, path: "/dashboard/profile" },
          ].map((item) => {
            const isActive = item.id ? activeTab === item.id : location.pathname === item.path;
            return item.path ? (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 relative",
                  isActive 
                    ? "bg-navy-950 text-white shadow-lg shadow-navy-950/20" 
                    : "text-navy-950/60 hover:bg-sand-100 hover:text-navy-950"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute right-4 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ) : (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.id!)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 w-full text-left",
                  isActive 
                    ? "bg-navy-950 text-white shadow-lg shadow-navy-950/20" 
                    : "text-navy-950/60 hover:bg-sand-100 hover:text-navy-950"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pt-4 border-t border-sand-100">
          <button 
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-28 pb-12 px-4 md:px-10 max-w-6xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">Welcome back, <span className="text-gold-600 italic">{user?.name || "Guest"}</span></h1>
          <p className="text-navy-950/50">Here's what's happening with your Hampi trips.</p>
        </header>

        <ProfileIncompleteBanner />
        
        {user?.kycStatus !== 'VERIFIED' && !hideKycBanner && (
          <div className="bg-gradient-to-r from-navy-950 to-navy-800 rounded-3xl p-6 md:p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-luxury border border-gold-900/30 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 mix-blend-screen" />
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gold-500 flex items-center justify-center shrink-0">
                <Shield className="w-8 h-8 text-navy-950" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-1">Verify Your Identity</h3>
                <p className="text-sand-200 text-sm max-w-xl">
                  Complete Your KYC to unlock additional features and become a verified traveller. Unlocks Verified Traveller Badge, Loyalty Rewards, Premium Offers, and Faster Support.
                </p>
              </div>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Button 
                variant="outline" 
                className="border-sand-300 text-sand-100 hover:bg-white/10"
                onClick={() => {
                  sessionStorage.setItem('hideKycBanner', 'true');
                  setHideKycBanner(true);
                }}
              >
                Remind Me Later
              </Button>
              <Link to="/dashboard/kyc" className="w-full sm:w-auto">
                <Button className="w-full bg-gold-500 text-navy-950 hover:bg-gold-400">
                  Complete KYC
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {quickActions.map((action, i) => (
            action.link ? (
              <Link key={action.label} to={action.link}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-sand-100 shadow-sm flex flex-col items-center gap-3 hover:border-gold-300 hover:shadow-md transition-all cursor-pointer text-center h-full"
                >
                  <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0", action.bg)}>
                    <action.icon className={cn("w-5 h-5 md:w-7 md:h-7", action.color)} />
                  </div>
                  <p className="text-[10px] md:text-xs font-bold text-navy-950 uppercase tracking-widest">{action.label}</p>
                </motion.div>
              </Link>
            ) : (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={action.action}
                className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-sand-100 shadow-sm flex flex-col items-center gap-3 hover:border-gold-300 hover:shadow-md transition-all cursor-pointer text-center h-full"
              >
                <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0", action.bg)}>
                  <action.icon className={cn("w-5 h-5 md:w-7 md:h-7", action.color)} />
                </div>
                <p className="text-[10px] md:text-xs font-bold text-navy-950 uppercase tracking-widest">{action.label}</p>
              </motion.div>
            )
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Upcoming Trip Section */}
            {/* Left Column */}
            <section className="lg:col-span-8">
              
              {/* Booking Summary Section */}
              <div className="bg-white p-6 rounded-[2rem] border border-sand-100 shadow-sm mb-8">
                <h3 className="text-sm font-bold text-navy-950 uppercase tracking-widest mb-4">Booking Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-navy-950">{upcomingCount}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-navy-950/50">Upcoming</p>
                  </div>
                  <div className="border-l border-sand-100">
                    <p className="text-2xl font-bold text-navy-950">{completedCount}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-navy-950/50">Completed</p>
                  </div>
                  <div className="border-l border-sand-100">
                    <p className="text-2xl font-bold text-navy-950">{cancelledCount}</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-navy-950/50">Cancelled</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-navy-950">{upcomingTrip ? "Upcoming Stay" : "Recommended Stays"}</h2>
                <Link to={upcomingTrip ? "/dashboard/bookings" : "/resorts"} className="text-navy-950/40 text-xs font-bold uppercase tracking-widest hover:text-gold-600 transition-colors">
                  {upcomingTrip ? "View all" : "Browse all"}
                </Link>
              </div>
              
              {(() => {
                if (!promoSettings?.enableRecommendations || !promoSettings?.enableDashboardBanner || !upcomingTrip || hasGuideBooking) return null;
                const checkInDate = new Date(bookings[0]?.checkIn || Date.now());
                const daysUntil = (checkInDate.getTime() - Date.now()) / (1000 * 3600 * 24);
                if (daysUntil > 30) return null;
                
                return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-gold-500" />
                    <h3 className="text-xl font-serif font-bold text-navy-950">Recommended For Your Trip</h3>
                  </div>
                  {recommendedGuides.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recommendedGuides.map(guide => (
                        <div key={guide.id} className="bg-white rounded-[2rem] p-6 border border-sand-200 shadow-sm flex flex-col justify-between hover:shadow-luxury transition-shadow relative overflow-hidden">
                          {promoSettings.enableBundleOffers && promoSettings.bundleDiscountAmount > 0 && (
                            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                              Save ₹{promoSettings.bundleDiscountAmount}
                            </div>
                          )}
                          <div>
                            <div className="w-16 h-16 rounded-full overflow-hidden mb-4 border-2 border-gold-200">
                              <img src={guide.user?.avatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop"} alt={guide.user?.name} className="w-full h-full object-cover" />
                            </div>
                            <h4 className="font-bold text-navy-950 text-lg mb-1">{guide.user?.name}</h4>
                            <div className="flex items-center gap-1 text-gold-500 mb-4">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="text-xs font-bold text-navy-950">{guide.rating.toFixed(1)} Rating</span>
                            </div>
                            <div className="space-y-1.5 mb-6">
                              <p className="text-xs text-navy-950"><span className="font-bold text-navy-950/50">Languages:</span> {guide.languages?.join(' • ')}</p>
                              <p className="text-xs text-navy-950"><span className="font-bold text-navy-950/50">Experience:</span> {guide.yearsExperience} Years</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-end justify-between mb-4">
                              <span className="text-[10px] uppercase font-bold text-navy-950/40 tracking-widest">Starting</span>
                              <span className="font-bold text-navy-950 text-lg">₹{guide.pricePerDay}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1 rounded-xl h-10 text-xs border-sand-200 text-navy-950"
                                onClick={() => {
                                  apiClient.post('/users/guide-promotion-analytics/track', { type: 'profileView' }).catch(()=>{});
                                  navigate(`/guides`);
                                }}
                              >
                                View Guide
                              </Button>
                              <Button 
                                className="flex-1 rounded-xl h-10 text-xs bg-navy-950 text-white"
                                onClick={() => {
                                  apiClient.post('/users/guide-promotion-analytics/track', { type: 'click' }).catch(()=>{});
                                  navigate(`/guides`);
                                }}
                              >
                                Book Guide
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white p-8 md:p-10 shadow-lg border border-gold-900/30">
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 mix-blend-screen" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 mix-blend-screen" />
                      
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 space-y-4 text-center md:text-left">
                          <h3 className="text-2xl md:text-3xl font-serif font-bold text-white flex items-center justify-center md:justify-start gap-3">
                            <Landmark className="w-8 h-8 shrink-0 text-sand-100" />
                            {promoSettings.bannerText?.replace('🏛️', '').trim() || promoSettings.bannerText}
                          </h3>
                          <p className="text-navy-200 text-sm md:text-base max-w-md font-medium leading-relaxed">
                            Discover hidden temples, royal stories, sunrise viewpoints, and hidden gems with certified Hampi guides.
                          </p>
                        </div>
                        
                        <div className="shrink-0 flex flex-col items-center">
                          <Button className="relative bg-gold-500 text-navy-950 hover:bg-gold-400 px-8 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 transition-transform hover:scale-105" onClick={() => {
                            apiClient.post('/users/guide-promotion-analytics/track', { type: 'click' }).catch(()=>{});
                            navigate('/guides');
                          }}>
                            {promoSettings.ctaText || "Explore Guides"}
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          {promoSettings.enableBundleOffers && promoSettings.bundleDiscountAmount > 0 && (
                            <p className="mt-3 text-[10px] text-gold-300/80 font-bold uppercase tracking-widest text-center">
                              Save ₹{promoSettings.bundleDiscountAmount} when booked together
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
                );
              })()}
              
              {isLoading ? (
                <div className="bg-white rounded-[2.5rem] p-12 border border-sand-100 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : upcomingTrip ? (
                <>
                  <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm overflow-hidden flex flex-col md:flex-row mb-8">
                    <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden">
                      <img src={upcomingTrip.image} alt={upcomingTrip.resortName} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-8 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-green-100">
                            {upcomingTrip.status}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-navy-950 mb-2">{upcomingTrip.resortName}</h3>
                        <div className="flex items-center gap-4 text-sm text-navy-950/60 mb-6">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-gold-500" />
                            {upcomingTrip.location}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gold-500" />
                            {upcomingTrip.dates}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link to="/dashboard/bookings">
                          <Button className="bg-navy-950 text-white hover:bg-gold-600 px-5 rounded-xl text-xs font-bold tracking-widest uppercase h-10 flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" /> View Booking
                          </Button>
                        </Link>
                        <Button variant="outline" className="border-navy-900/20 text-navy-950 hover:bg-sand-50 rounded-xl px-4 h-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest" onClick={() => toast.success("Invoice downloading...")}>
                          <Download className="w-4 h-4" /> Invoice
                        </Button>
                        <Button variant="outline" className="border-navy-900/20 text-navy-950 hover:bg-sand-50 rounded-xl px-4 h-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest" onClick={() => toast.success("Opening maps...")}>
                          <MapPin className="w-4 h-4" /> Directions
                        </Button>
                        <Button variant="outline" className="border-navy-900/20 text-navy-950 hover:bg-sand-50 rounded-xl px-4 h-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest" onClick={() => toast.success("Calling resort...")}>
                          <Phone className="w-4 h-4" /> Call
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-navy-900/20 text-navy-950 hover:bg-sand-50 rounded-xl px-4 h-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                          onClick={() => {
                            setActiveTab("inbox");
                            if (bookings[0]) setActiveMessageBooking(bookings[0]);
                          }}
                        >
                          <Mail className="w-4 h-4" /> Contact
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Hampi Weather Widget */}
                    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 p-6 rounded-[2rem] border border-sky-100 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sun className="w-5 h-5 text-amber-500" />
                          <h3 className="font-bold text-navy-950">Hampi Weather</h3>
                        </div>
                        <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-md text-navy-950 shadow-sm uppercase tracking-widest">Today</span>
                      </div>
                      <div className="flex items-end gap-3 mb-6">
                        <span className="text-4xl font-black text-navy-950">32°</span>
                        <span className="text-sm font-bold text-navy-950/50 mb-1 flex items-center gap-1"><Cloud className="w-4 h-4"/> Clear Skies</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl flex items-center gap-3">
                          <Sunrise className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-[9px] uppercase font-bold text-navy-950/50">Sunrise</p>
                            <p className="text-sm font-bold text-navy-950">06:12 AM</p>
                          </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl flex items-center gap-3">
                          <Sunset className="w-5 h-5 text-rose-500 shrink-0" />
                          <div>
                            <p className="text-[9px] uppercase font-bold text-navy-950/50">Sunset</p>
                            <p className="text-sm font-bold text-navy-950">06:45 PM</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-navy-950/60 mt-4 italic">
                        ✨ Tip: Matanga Hill offers the best sunrise views.
                      </p>
                    </div>

                    {/* Itinerary Timeline */}
                    <div className="bg-white p-6 rounded-[2rem] border border-sand-100 shadow-sm">
                      <h3 className="font-bold text-navy-950 mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gold-500" />
                        Upcoming Itinerary
                      </h3>
                      <div className="space-y-6 relative before:absolute before:inset-y-2 before:left-[11px] before:w-0.5 before:bg-sand-200">
                        <div className="relative flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-gold-100 border-2 border-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                            <div className="w-2 h-2 bg-gold-500 rounded-full" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest mb-0.5">2:00 PM</p>
                            <p className="text-sm font-bold text-navy-950">Check-in at {upcomingTrip.resortName}</p>
                          </div>
                        </div>
                        <div className="relative flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-sand-100 border-2 border-white flex items-center justify-center shrink-0 z-10">
                            <div className="w-2 h-2 bg-sand-300 rounded-full" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-navy-950/50 uppercase tracking-widest mb-0.5">4:30 PM</p>
                            <p className="text-sm font-bold text-navy-950">Scheduled Buggy Tour</p>
                          </div>
                        </div>
                        <div className="relative flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-sand-100 border-2 border-white flex items-center justify-center shrink-0 z-10">
                            <div className="w-2 h-2 bg-sand-300 rounded-full" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-navy-950/50 uppercase tracking-widest mb-0.5">7:00 PM</p>
                            <p className="text-sm font-bold text-navy-950">Dinner Reservation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-[2.5rem] border border-dashed border-sand-300 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-sand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-navy-950/20" />
                  </div>
                  <h3 className="text-xl font-bold text-navy-950 mb-2">No upcoming trips</h3>
                  <p className="text-navy-950/50 mb-6 max-w-xs mx-auto">Your next adventure in Hampi is waiting. Explore our collection of hand-picked resorts.</p>
                  <Link to="/resorts">
                    <Button variant="outline" className="rounded-xl">Start Exploring</Button>
                  </Link>
                </div>
              )}

              {/* Savings & Rewards Widget */}
              {(() => {
                const totalSavings = bookings.reduce((sum, b: any) => sum + (b.discountAmount || 0), 0);
                const promotionsUsed = bookings.filter((b: any) => b.discountAmount && b.discountAmount > 0).length;
                const bestDiscount = bookings.reduce((max, b: any) => Math.max(max, b.discountAmount || 0), 0);

                if (totalSavings > 0) {
                  return (
                    <div className="mt-8">
                      <div className="p-6 rounded-[2rem] bg-navy-950 border border-navy-900 shadow-md text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                          <Heart className="w-32 h-32 text-gold-500" />
                        </div>
                        <div className="relative z-10">
                          <h2 className="text-xl font-serif font-bold text-gold-500 mb-2">Savings & Rewards</h2>
                          <p className="text-sm text-sand-200 mb-6">Your total savings from HampiStays promotions</p>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-sand-400 uppercase tracking-widest font-bold mb-1">Total Saved</p>
                              <p className="text-2xl font-bold text-white">₹{totalSavings}</p>
                            </div>
                            <div>
                              <p className="text-xs text-sand-400 uppercase tracking-widest font-bold mb-1">Offers Used</p>
                              <p className="text-2xl font-bold text-white">{promotionsUsed}</p>
                            </div>
                            <div>
                              <p className="text-xs text-sand-400 uppercase tracking-widest font-bold mb-1">Best Offer</p>
                              <p className="text-2xl font-bold text-white">₹{bestDiscount}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Refer & Earn Widget */}
              {referralData && (
                <div className="mt-8">
                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-gold-500 to-gold-400 border border-gold-300 shadow-luxury text-navy-950 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 p-4 opacity-10 pointer-events-none rotate-12">
                      <Gift className="w-64 h-64 text-navy-950" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-md shadow-sm">
                          <Share className="w-6 h-6 text-navy-950" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-serif font-bold leading-tight">Refer & Earn ₹500</h2>
                          {referralData.availableCredits > 0 && (
                            <p className="text-sm font-bold bg-navy-950 text-white inline-block px-3 py-1 rounded-full mt-1">
                              You have ₹{referralData.availableCredits} in travel credits
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-navy-900 mb-8 max-w-md font-medium leading-relaxed">
                        Share your unique code with friends. They get a discount on their first stay, and you earn ₹500 in HampiStays credits!
                      </p>
                      
                      <div className="bg-white/50 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between max-w-sm border border-white shadow-sm mb-8">
                        <span className="font-mono font-bold text-xl px-4 tracking-widest text-navy-950">{referralData.referralCode}</span>
                        <Button 
                          className="bg-navy-950 text-white hover:bg-navy-800 rounded-xl shadow-md px-6 transition-all active:scale-95"
                          onClick={() => {
                            navigator.clipboard.writeText(referralData.referralCode);
                            toast.success("Referral code copied!");
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" /> Copy
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-6 pt-6 border-t border-navy-950/10">
                        <div>
                          <p className="text-[10px] text-navy-900/60 uppercase tracking-widest font-black mb-1">Available Credits</p>
                          <p className="text-2xl font-black tracking-tight">₹{referralData.availableCredits || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-navy-900/60 uppercase tracking-widest font-black mb-1">Pending Referrals</p>
                          <p className="text-2xl font-black tracking-tight">{referralData.pendingCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-navy-900/60 uppercase tracking-widest font-black mb-1">Completed</p>
                          <p className="text-2xl font-black tracking-tight">{referralData.completedCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Promotions */}
              {activePromotions.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-serif font-bold text-navy-950">Active Promotions</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activePromotions.slice(0, 2).map((promo: any) => (
                      <div key={promo.id} className="p-5 rounded-[2rem] border border-sand-200 bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-lg font-bold text-navy-950">🎉 {promo.name}</p>
                            {promo.autoApply ? (
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Auto Applied
                              </span>
                            ) : (
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(promo.code);
                                  toast.success("Code copied!");
                                }}
                                className="text-[10px] font-bold text-gold-600 uppercase tracking-wider bg-gold-50 hover:bg-gold-100 px-2 py-1 rounded-md border border-gold-100 flex items-center gap-1 transition-colors"
                              >
                                {promo.code} <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-navy-950/60 mb-4">
                            {promo.description || (promo.discountType?.toLowerCase() === 'percentage' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`)}
                            {promo.minBookingAmount ? ` on bookings above ₹${promo.minBookingAmount}` : ''}
                          </p>
                        </div>
                        <Link to="/resorts">
                          <Button variant="outline" size="sm" className="w-full text-xs font-bold uppercase tracking-widest border-navy-950 text-navy-950">
                            Explore Stays
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Viewed */}
              {recentlyViewed.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-serif font-bold text-navy-950">Recently Viewed</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentlyViewed.map((resort: any) => (
                      <Link key={resort.id} to={`/resorts/${resort.slug}`} className="block group">
                        <div className="bg-white rounded-3xl border border-sand-100 overflow-hidden shadow-sm hover:shadow-md transition">
                          <div className="h-32 overflow-hidden">
                            <img src={resort.images?.[0]} alt={resort.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                          </div>
                          <div className="p-4">
                            <p className="font-bold text-navy-950 truncate text-sm">{resort.name}</p>
                            <p className="text-[10px] text-navy-950/40 uppercase tracking-widest mt-1">Hampi, Karnataka</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </section>

            {/* Wishlist Section */}
            <section className="lg:col-span-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-navy-950">Saved Resorts</h2>
                <Link to="/resorts" className="text-navy-950/40 text-xs font-bold uppercase tracking-widest hover:text-gold-600 transition-colors">Browse</Link>
              </div>
              
              {wishlist.length > 0 ? (
                <div className="space-y-4">
                  {wishlist.slice(0, 4).map((resort: any) => (
                    <Link
                      key={resort.id}
                      to={`/resorts/${resort.slug}`}
                      className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-sand-100 hover:border-gold-400 hover:shadow-md transition-all group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <img src={resort.images?.[0]} alt={resort.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-navy-950 truncate text-sm mb-1">{resort.name}</p>
                        <p className="text-[10px] text-navy-950/40 uppercase tracking-widest">{resort.location?.area || "Hampi"}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-navy-950/20 group-hover:text-gold-600 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-dashed border-sand-300 p-8 text-center shadow-sm">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-5 h-5 text-red-500/40" />
                  </div>
                  <h3 className="text-sm font-bold text-navy-950 mb-1">No saved resorts</h3>
                  <p className="text-xs text-navy-950/50 mb-4">Keep track of your favorite stays by hearting them.</p>
                  <Link to="/resorts">
                    <Button variant="outline" size="sm" className="rounded-xl w-full">Explore</Button>
                  </Link>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "inbox" && (
          <div className="bg-white rounded-[3.5rem] border border-sand-200 shadow-xl overflow-hidden flex h-[600px] relative">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-sand-100 flex flex-col bg-sand-50/30">
              <div className="p-8 border-b border-sand-100">
                <h3 className="text-2xl font-serif font-bold text-navy-950 mb-1">My Inbox</h3>
                <p className="text-[10px] text-navy-950/40 uppercase tracking-widest font-bold">Resort Chats</p>
              </div>
              <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {bookings.map((booking: Booking) => (
                  <button 
                    key={booking.id}
                    onClick={() => setActiveMessageBooking(booking)}
                    className={cn("w-full text-left p-5 rounded-[2rem] border transition-all duration-300", 
                      activeMessageBooking?.id === booking.id 
                        ? "bg-navy-950 border-navy-950 shadow-lg shadow-navy-950/20" 
                        : "bg-white border-sand-100 hover:border-gold-300 hover:shadow-md")}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm", 
                        activeMessageBooking?.id === booking.id ? "bg-gold-500 text-navy-950" : "bg-sand-100 text-navy-950")}>
                        {booking.resort?.name[0]}
                      </div>
                      <div className="overflow-hidden">
                        <p className={cn("text-sm font-bold truncate", activeMessageBooking?.id === booking.id ? "text-white" : "text-navy-950")}>
                          {booking.resort?.name}
                        </p>
                        <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-0.5", activeMessageBooking?.id === booking.id ? "text-gold-400" : "text-navy-950/40")}>
                          {new Date(booking.checkIn).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {bookings.length === 0 && (
                  <div className="text-center py-20 px-8">
                    <Mail className="w-8 h-8 text-sand-300 mx-auto mb-4" />
                    <p className="text-sm text-navy-950/30 italic">No bookings to message.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area & Sidebar Wrapper */}
            <div className="flex-grow flex bg-white relative">
              {activeMessageBooking ? (
                <>
                  {/* Chat Panel */}
                  <div className="flex-grow flex flex-col border-r border-sand-100 h-full overflow-hidden">
                    <div className="p-8 border-b border-sand-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-2xl bg-navy-950 text-gold-500 flex items-center justify-center font-bold text-xl">
                           {activeMessageBooking.resort?.name[0]}
                         </div>
                         <div>
                           <p className="text-lg font-bold text-navy-950">{activeMessageBooking.resort?.name}</p>
                           <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             Resort Concierge Live
                           </p>
                         </div>
                      </div>
                    </div>

                    <div className="flex-grow p-8 overflow-y-auto space-y-6 bg-sand-50/10 flex flex-col">
                      <div className="flex-grow space-y-6">
                        {messages.map((msg) => (
                          <motion.div 
                            key={msg.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn("flex flex-col", msg.senderId === user?.id ? "items-end" : "items-start")}
                          >
                            <div className={cn("max-w-[80%] p-5 rounded-[2rem] shadow-md transition-all duration-300", 
                              msg.senderId === user?.id 
                                ? "bg-gradient-to-br from-navy-950 to-navy-800 text-white rounded-tr-none border border-white/10" 
                                : "bg-white border border-sand-200 text-navy-950 rounded-tl-none")}>
                              <p className={cn("text-sm leading-relaxed font-medium", msg.senderId === user?.id ? "!text-white" : "!text-navy-950")}>{msg.text}</p>
                              <div className={cn("flex items-center gap-2 mt-3", msg.senderId === user?.id ? "justify-end" : "justify-start")}>
                                <span className={cn("text-[8px] font-bold uppercase tracking-widest", msg.senderId === user?.id ? "text-gold-400/80" : "text-navy-950/40")}>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {/* Live Typing Indicator */}
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3"
                          >
                            <div className="w-8 h-8 rounded-xl bg-navy-950 text-gold-500 flex items-center justify-center font-bold text-xs shadow-sm">
                              {activeMessageBooking.resort?.name[0]}
                            </div>
                            <div className="bg-white border border-sand-200 text-navy-950 p-4 rounded-[2rem] rounded-tl-none shadow-md flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-navy-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-navy-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-navy-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleSendMessage} className="p-8 border-t border-sand-100 bg-white">
                      <div className="flex gap-4 items-center bg-sand-50 p-2 rounded-[2.5rem] border border-sand-200">
                        <input 
                          type="text" 
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          placeholder="Ask about check-in, dining, or heritage tours..."
                          className="flex-grow bg-transparent px-6 py-3 outline-none text-navy-950 font-medium"
                        />
                        <Button type="submit" className="rounded-full w-14 h-14 p-0 shadow-gold">
                          <ChevronRight className="w-6 h-6" />
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Active Stay Details Sidebar Drawer */}
                  <div className="w-80 border-l border-sand-100 flex flex-col bg-sand-50/10 h-full overflow-y-auto">
                    <div className="p-6 border-b border-sand-100 text-center bg-white/40">
                      <div className="w-20 h-20 mx-auto rounded-3xl overflow-hidden shadow-md border-2 border-white mb-3">
                        <img 
                          src={activeMessageBooking.resort?.images?.[0] || "https://images.unsplash.com/photo-1581012771300-224937651c42?auto=format&fit=crop&q=80&w=1000"} 
                          alt={activeMessageBooking.resort?.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-sm font-serif font-bold text-navy-950 leading-tight">{activeMessageBooking.resort?.name}</h4>
                      <p className="text-[10px] text-navy-950/50 flex items-center justify-center gap-1 mt-1 font-semibold uppercase tracking-wider">
                        <MapPin className="w-3 h-3 text-gold-500" />
                        {activeMessageBooking.resort?.locationArea}
                      </p>
                    </div>

                    <div className="p-6 space-y-6 flex-grow">
                      <div>
                        <p className="text-[9px] text-navy-950/40 uppercase tracking-widest font-bold mb-2.5">Reservation Info</p>
                        <div className="bg-white p-4 rounded-2xl border border-sand-100 space-y-3 shadow-sm">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-navy-950/50">Reference</span>
                            <span className="font-mono font-bold text-navy-950">{activeMessageBooking.referenceNumber}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-navy-950/50">Check-in</span>
                            <span className="font-bold text-navy-950">{new Date(activeMessageBooking.checkIn).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-navy-950/50">Guests</span>
                            <span className="font-bold text-navy-950">{activeMessageBooking.guests} Adults</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-navy-950/50">Status</span>
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                              activeMessageBooking.status === "CHECKED_IN" 
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gold-100 text-gold-800"
                            )}>
                              {activeMessageBooking.status === "CHECKED_IN" ? "Checked In" : "Confirmed"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-[9px] text-navy-950/40 uppercase tracking-widest font-bold mb-2.5">Quick Actions</p>
                        <div className="space-y-2">
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeMessageBooking.resort?.name + ', Hampi')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-gold-50/50 border border-sand-100 hover:border-gold-300 rounded-xl transition-all group shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-navy-950">Get Directions</p>
                                <p className="text-[9px] text-navy-950/40">Open in Google Maps</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-navy-950/20 group-hover:text-gold-600 transition-colors" />
                          </a>

                          <button 
                            onClick={() => setShowStayPassModal(activeMessageBooking)}
                            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-gold-50/50 border border-sand-100 hover:border-gold-300 rounded-xl transition-all group shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Compass className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-navy-950">Digital Stay Pass</p>
                                <p className="text-[9px] text-navy-950/40">View QR & Entry Pass</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-navy-950/20 group-hover:text-gold-600 transition-colors" />
                          </button>

                          <a 
                            href="tel:+919876543210"
                            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-gold-50/50 border border-sand-100 hover:border-gold-300 rounded-xl transition-all group shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Phone className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-navy-950">Call Front Desk</p>
                                <p className="text-[9px] text-navy-950/40">24/7 Support Line</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-navy-950/20 group-hover:text-gold-600 transition-colors" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-20 text-center bg-sand-50/5">
                  <div className="w-20 h-20 bg-sand-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-sand-100 rotate-12">
                    <Mail className="w-10 h-10 text-gold-500 -rotate-12" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">Concierge Messages</h3>
                  <p className="text-navy-950/40 max-w-xs mx-auto text-sm">
                    Chat directly with resort owners to coordinate your arrival, request meals, or explore Hampi heritage tours.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "kyc" && hasKycRequirements && (
          <div className="max-w-4xl mx-auto">
             <div className="mb-6">
                <h2 className="text-3xl font-serif font-bold text-navy-950 mb-2">Identity Verification</h2>
                <p className="text-navy-950/60">Upload your government-issued documents to comply with local regulations.</p>
             </div>
             <KycUploadSection userType="traveler" profileId={user?.id || ""} />
          </div>
        )}
      </main>

      {/* Luxurious Digital Stay Pass Modal */}
      <AnimatePresence>
        {showStayPassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStayPassModal(null)}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            />
            
            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative bg-white w-full max-w-sm rounded-[3rem] border border-sand-200 overflow-hidden shadow-2xl p-8 text-center"
            >
              {/* Gold luxury accents */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-gold-400 via-gold-600 to-gold-400" />
              
              <button 
                onClick={() => setShowStayPassModal(null)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-sand-50 border border-sand-100 flex items-center justify-center text-navy-950 hover:bg-gold-500 hover:text-navy-950 transition-all font-bold text-xs"
              >
                ✕
              </button>

              <div className="flex items-center justify-center gap-2 mb-2 mt-4">
                <Shield className="w-5 h-5 text-gold-600 animate-pulse" />
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest font-mono">Contactless Stay Pass Active</p>
              </div>

              <h3 className="text-xl font-serif font-bold text-navy-950 mb-1">{showStayPassModal.resort?.name}</h3>
              <p className="text-xs text-navy-950/40 font-medium mb-6">Vijayanagara Valley Retreat, Hampi</p>

              {/* QR Code Container */}
              <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48 bg-white p-4 rounded-3xl shadow-inner border border-gold-200 flex items-center justify-center group hover:scale-[1.02] transition-transform duration-300">
                  {/* Frame corners */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold-500 rounded-tl" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold-500 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold-500 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold-500 rounded-br" />
                  
                  {/* High-fidelity simulated SVG QR Code */}
                  <svg className="w-40 h-40 text-navy-950" viewBox="0 0 100 100">
                    {/* Position detection markers */}
                    <rect x="5" y="5" width="20" height="20" fill="currentColor" rx="2" />
                    <rect x="9" y="9" width="12" height="12" fill="white" rx="1" />
                    <rect x="12" y="12" width="6" height="6" fill="currentColor" rx="0.5" />

                    <rect x="75" y="5" width="20" height="20" fill="currentColor" rx="2" />
                    <rect x="79" y="9" width="12" height="12" fill="white" rx="1" />
                    <rect x="82" y="12" width="6" height="6" fill="currentColor" rx="0.5" />

                    <rect x="5" y="75" width="20" height="20" fill="currentColor" rx="2" />
                    <rect x="9" y="79" width="12" height="12" fill="white" rx="1" />
                    <rect x="12" y="82" width="6" height="6" fill="currentColor" rx="0.5" />

                    {/* Simulated random QR data blocks */}
                    <path d="M 30,5 h 5 v 5 h -5 z M 40,5 h 10 v 5 h -10 z M 55,5 h 5 v 10 h -5 z M 65,5 h 5 v 5 h -5 z" fill="currentColor" />
                    <path d="M 30,15 h 15 v 5 h -15 z M 50,15 h 5 v 5 h -5 z M 60,15 h 10 v 5 h -10 z" fill="currentColor" />
                    <path d="M 5,30 h 5 v 15 h -5 z M 15,30 h 10 v 5 h -10 z M 35,30 h 5 v 10 h -5 z M 45,30 h 15 v 5 h -15 z M 65,30 h 15 v 5 h -15 z M 85,30 h 10 v 5 h -10 z" fill="currentColor" />
                    <path d="M 10,40 h 5 v 5 h -5 z M 20,40 h 10 v 5 h -10 z M 40,40 h 5 v 10 h -5 z M 50,40 h 10 v 5 h -10 z M 70,40 h 5 v 15 h -5 z" fill="currentColor" />
                    <path d="M 30,55 h 5 v 5 h -5 z M 40,55 h 15 v 5 h -15 z M 60,55 h 5 v 5 h -5 z M 75,55 h 10 v 5 h -10 z" fill="currentColor" />
                    <path d="M 35,65 h 10 v 5 h -10 z M 50,65 h 5 v 15 h -5 z M 60,65 h 15 v 5 h -15 z M 80,65 h 10 v 5 h -10 z" fill="currentColor" />
                    <path d="M 30,75 h 10 v 5 h -10 z M 45,75 h 5 v 5 h -5 z M 65,75 h 5 v 15 h -5 z M 75,75 h 15 v 5 h -15 z" fill="currentColor" />
                    <path d="M 35,85 h 5 v 10 h -5 z M 45,85 h 10 v 5 h -10 z M 60,85 h 5 v 5 h -5 z M 80,85 h 10 v 5 h -10 z" fill="currentColor" />

                    {/* Decorative Brand Logo in center of QR */}
                    <rect x="42" y="42" width="16" height="16" fill="white" rx="3" />
                    <circle cx="50" cy="50" r="6" fill="#0f172a" />
                    <path d="M 48,50 L 52,50 L 50,47 Z" fill="#eab308" />
                  </svg>
                </div>
              </div>

              {/* Pass details */}
              <div className="bg-sand-50/50 rounded-2xl p-4 border border-sand-100 space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-navy-950/40">Guest Name</span>
                  <span className="font-bold text-navy-950">{user?.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-navy-950/40">Pass Number</span>
                  <span className="font-mono font-bold text-gold-700">{showStayPassModal.referenceNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-navy-950/40">Dates</span>
                  <span className="font-bold text-navy-950">
                    {new Date(showStayPassModal.checkIn).toLocaleDateString()} - {new Date(showStayPassModal.checkOut).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button variant="outline" className="w-full text-[10px] uppercase tracking-widest rounded-xl py-2 flex items-center justify-center">
                  <Download className="w-3 h-3 mr-1.5" /> PDF
                </Button>
                <Button variant="outline" className="w-full text-[10px] uppercase tracking-widest rounded-xl py-2 flex items-center justify-center">
                  <Smartphone className="w-3 h-3 mr-1.5" /> Wallet
                </Button>
                <Button variant="outline" className="w-full text-[10px] uppercase tracking-widest rounded-xl py-2 flex items-center justify-center">
                  <Share className="w-3 h-3 mr-1.5" /> Share
                </Button>
                <Button variant="outline" className="w-full text-[10px] uppercase tracking-widest rounded-xl py-2 flex items-center justify-center">
                  <Phone className="w-3 h-3 mr-1.5" /> Contact
                </Button>
              </div>

              <div className="text-[10px] text-navy-950/40 leading-relaxed max-w-xs mx-auto">
                Present this QR code at the contactless gateway or baggage counter upon your arrival for seamless entry.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

