import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, Heart, User, LogOut, 
  ChevronRight, MapPin, Star,
  LayoutDashboard, ShoppingBag, Bell, Mail
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";
import { ProfileIncompleteBanner } from "../../components/shared/ProfileIncompleteBanner";
import type { Booking, Message } from "../../types/booking";
import type { Resort } from "../../types/resort";


export function TravelerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<Resort[]>([]); // TODO: Define Wishlist interface if needed
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeMessageBooking, setActiveMessageBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [bookingsRes, wishlistRes] = await Promise.all([
          fetch(`/api/users/${user.id}/bookings`),
          fetch(`/api/users/${user.id}/wishlist`)
        ]);

        if (bookingsRes.ok) setBookings(await bookingsRes.json());
        if (wishlistRes.ok) setWishlist(await wishlistRes.json());
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
      fetch(`/api/users/${user.id}/wishlist`)
        .then(res => res.json())
        .then(data => setWishlist(data))
        .catch(err => console.error("Real-time wishlist sync failed:", err));
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'inbox' && activeMessageBooking) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(`/api/messages/${activeMessageBooking.id}`);
          if (res.ok) setMessages(await res.json());
        } catch (err) {
          console.error("Poll failed", err);
        }
      };
      fetchMessages();
      interval = setInterval(fetchMessages, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab, activeMessageBooking]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeMessageBooking) return;
    
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newMessage,
          senderId: user?.id,
          bookingId: activeMessageBooking.id
        })
      });
      if (response.ok) {
        const savedMsg = await response.json();
        setMessages(prev => [...prev, savedMsg]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };



  const stats = [
    { label: "Bookings", value: bookings.length.toString(), icon: Calendar, color: "text-gold-600", bg: "bg-gold-50", link: "/dashboard/bookings" },
    { label: "Saved Resorts", value: wishlist.length.toString(), icon: Heart, color: "text-red-500", bg: "bg-red-50", link: "/dashboard/wishlist" },
    { label: "Loyalty Points", value: "1,250", icon: Star, color: "text-blue-600", bg: "bg-blue-50", link: "/dashboard" },
  ];

  const upcomingTrip = bookings[0] ? {
    resortName: bookings[0].resort?.name || "Resort",
    dates: `${new Date(bookings[0].checkIn).toLocaleDateString()} - ${new Date(bookings[0].checkOut).toLocaleDateString()}`,
    status: "Confirmed",
    image: bookings[0].resort?.images?.[0] || "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=1000",
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
            { name: "My Bookings", icon: ShoppingBag, path: "/dashboard/bookings" },
            { name: "Guest Inbox", icon: Mail, id: "inbox" },
            { name: "Wishlist", icon: Heart, path: "/dashboard/wishlist" },
            { name: "Notifications", icon: Bell, path: "/dashboard/notifications" },
            { name: "Profile", icon: User, path: "/dashboard/profile" },
          ].map((item) => {
            const isActive = item.id ? activeTab === item.id : location.pathname === item.path;
            return item.path ? (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                  isActive 
                    ? "bg-navy-950 text-white shadow-lg shadow-navy-950/20" 
                    : "text-navy-950/60 hover:bg-sand-100 hover:text-navy-950"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all w-full text-left"
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, i) => (
            <Link key={stat.label} to={stat.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[2rem] border border-sand-100 shadow-sm flex items-center gap-5 hover:border-gold-300 hover:shadow-md transition-all cursor-pointer h-full"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", stat.bg)}>
                  <stat.icon className={cn("w-7 h-7", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-950">{stat.value}</p>
                  <p className="text-xs font-bold text-navy-950/40 uppercase tracking-widest">{stat.label}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Upcoming Trip Section */}
            <section className="lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif font-bold text-navy-950">Upcoming Stay</h2>
                <Link to="/dashboard/bookings" className="text-navy-950/40 text-xs font-bold uppercase tracking-widest hover:text-gold-600 transition-colors">View all</Link>
              </div>
              
              {isLoading ? (
                <div className="bg-white rounded-[2.5rem] p-12 border border-sand-100 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : upcomingTrip ? (
                <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
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
                    <div className="flex gap-3">
                      <Link to="/dashboard/bookings">
                        <Button size="sm" className="px-6 shadow-none">Check Details</Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="px-6"
                        onClick={() => {
                          setActiveTab("inbox");
                          setActiveMessageBooking(bookings[0]);
                        }}
                      >
                        Message Resort
                      </Button>
                    </div>
                  </div>
                </div>
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
            </section>

            {/* Quick Actions / Recent Activity */}
            <section className="lg:col-span-4">
              <h2 className="text-2xl font-serif font-bold text-navy-950 mb-6">Quick Actions</h2>
              <div className="space-y-4">
                {[
                  { name: "Explore New Resorts", path: "/resorts", desc: "Find your next escape" },
                  { name: "Write a Review", path: "/dashboard/bookings", desc: "Share your experience" },
                  { name: "Support Center", path: "/contact", desc: "Need help with a trip?" },
                ].map((action) => (
                  <Link
                    key={action.name}
                    to={action.path}
                    className="block p-5 bg-white rounded-2xl border border-sand-100 hover:border-gold-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-navy-950">{action.name}</p>
                      <ChevronRight className="w-4 h-4 text-navy-950/20 group-hover:text-gold-600 transition-colors" />
                    </div>
                    <p className="text-xs text-navy-950/50">{action.desc}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "inbox" && (
          <div className="bg-white rounded-[3.5rem] border border-sand-200 shadow-xl overflow-hidden flex h-[600px]">
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

            {/* Chat Area */}
            <div className="flex-grow flex flex-col bg-white">
              {activeMessageBooking ? (
                <>
                  <div className="p-8 border-b border-sand-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-navy-950 text-gold-500 flex items-center justify-center font-bold text-xl">
                         {activeMessageBooking.resort?.name[0]}
                       </div>
                       <div>
                         <p className="text-lg font-bold text-navy-950">{activeMessageBooking.resort?.name}</p>
                         <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Resort Help Desk</p>
                       </div>
                    </div>
                  </div>

                  <div className="flex-grow p-8 overflow-y-auto space-y-6 bg-sand-50/10">
                    {messages.map((msg) => (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex flex-col", msg.senderId === user?.id ? "items-end" : "items-start")}
                      >
                        <div className={cn("max-w-[80%] p-5 rounded-[2rem] shadow-xl transition-all duration-300", 
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
                  </div>

                  <form onSubmit={handleSendMessage} className="p-8 border-t border-sand-100 bg-white">
                    <div className="flex gap-4 items-center bg-sand-50 p-2 rounded-[2.5rem] border border-sand-200">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow bg-transparent px-6 py-3 outline-none text-navy-950 font-medium"
                      />
                      <Button type="submit" className="rounded-full w-14 h-14 p-0 shadow-gold">
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center p-20 text-center">
                  <div className="w-20 h-20 bg-sand-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-sand-100 rotate-12">
                    <Mail className="w-10 h-10 text-gold-500 -rotate-12" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-navy-950 mb-2">Concierge Messages</h3>
                  <p className="text-navy-950/40 max-w-xs mx-auto text-sm">
                    Chat directly with resort owners to coordinate your arrival or special requests.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

