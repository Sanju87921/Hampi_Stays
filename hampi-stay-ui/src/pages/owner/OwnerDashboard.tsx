import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, Plus, Calendar as CalIcon, Settings,
  Trash2, CheckCircle, AlertCircle, Loader2,
  IndianRupee, CalendarCheck, Users, TrendingUp, ChevronRight, X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "../../utils/cn";
import { ProfileIncompleteBanner } from "../../components/shared/ProfileIncompleteBanner";

export function OwnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resorts, setResorts] = useState<any[]>([]);
  const [activeResortIdx, setActiveResortIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    description: "",
    pricePerNight: "",
    capacity: "2",
    availableCount: "1"
  });
  const [isUpdatingResortPhotos, setIsUpdatingResortPhotos] = useState(false);
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const [showBookingsModal, setShowBookingsModal] = useState(false);

  const fetchResorts = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:5000/api/owners/${user.id}/resorts`);
      const data = await response.json();
      setResorts(data);
    } catch (error) {
      console.error("Error fetching resorts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResorts();
  }, [user]);

  const resort = resorts[activeResortIdx];

  const totalRevenue = resort?.bookings
    ?.filter((b: any) => b.status !== "CANCELLED")
    .reduce((sum: number, b: any) => sum + b.totalPrice, 0) || 0;

  const activeBookingsCount = resort?.bookings
    ?.filter((b: any) => b.status === "CONFIRMED" || b.status === "PENDING").length || 0;

  const stats = [
    { label: "Total Revenue", value: resort ? `₹${totalRevenue.toLocaleString("en-IN")}` : "₹0", icon: IndianRupee, trend: "+12.5%", color: "text-green-600 bg-green-50" },
    { label: "Active Bookings", value: resort ? activeBookingsCount.toString() : "0", icon: CalendarCheck, trend: "+3", color: "text-blue-600 bg-blue-50", onClick: () => setShowBookingsModal(true) },
    { label: "Guest Satisfaction", value: resort ? (resort.rating || "N/A").toString() + "/5" : "N/A", icon: Users, trend: "+0.2", color: "text-gold-600 bg-gold-50" },
    { label: "Resort Views", value: resort ? "12.8k" : "0", icon: TrendingUp, trend: "+18%", color: "text-purple-600 bg-purple-50" },
  ];

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resort) return;
    setIsAddingRoom(true);
    try {
      const response = await fetch(`http://localhost:5000/api/resorts/${resort.id}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...roomFormData,
          pricePerNight: parseFloat(roomFormData.pricePerNight),
          capacity: parseInt(roomFormData.capacity),
          availableCount: parseInt(roomFormData.availableCount)
        }),
      });
      if (response.ok) {
        setShowAddRoom(false);
        setRoomFormData({ name: "", description: "", pricePerNight: "", capacity: "2", availableCount: "1" });
        fetchResorts();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingRoom(false);
    }
  };

  const handleDeletePhoto = async (resortId: string, photoUrl: string) => {
    try {
      await fetch(`http://localhost:5000/api/resorts/${resortId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: photoUrl })
      });
      fetchResorts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadInvoice = (booking: any) => {
    const content = `
HAMPISTAYS — BUSINESS INVOICE
================================
Booking Reference: ${booking.referenceNumber}
Date Issued: ${new Date().toLocaleDateString("en-IN")}

GUEST: ${booking.user?.name}
EMAIL: ${booking.user?.email}

PROPERTY: ${resort.name}
LOCATION: ${resort.locationArea}, Hampi

BOOKING DETAILS
Check-in: ${new Date(booking.checkIn).toLocaleDateString("en-IN")}
Check-out: ${new Date(booking.checkOut).toLocaleDateString("en-IN")}
Guests: ${booking.guests}
Status: ${booking.status}

FINANCIAL SUMMARY
Total Revenue: ₹${booking.totalPrice?.toLocaleString("en-IN")}
GST (Included): 12%
Net Payout (Est): ₹${(booking.totalPrice * 0.93).toLocaleString("en-IN")} (7% Commission Deducted)

Verified by HampiStays Partner Network.
    `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${booking.referenceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBookingAction = async (bookingId: string, action: 'confirm' | 'reject') => {
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      if (response.ok) {
        fetchResorts();
      } else {
        alert("Failed to update booking status.");
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-24">
        <Loader2 className="w-10 h-10 text-gold-600 animate-spin" />
      </div>
    );
  }

  if (resorts.length === 0) {
    return (
      <div className="relative min-h-screen pt-24 pb-12 flex items-center justify-center overflow-hidden bg-navy-950">
        <img 
          src="/hampi-temple.png" 
          alt="Hampi Temple Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-40" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/20 to-transparent" />
        
        <div className="relative container mx-auto px-4 text-center z-10">
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto bg-sand-50/95 backdrop-blur-xl rounded-[3rem] p-12 shadow-2xl border border-sand-100">
            <div className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-gold relative overflow-hidden">
              <Building2 className="w-10 h-10 text-navy-950 relative z-10" />
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-navy-950 mb-4">
              Welcome to <span className="italic text-gold-600">Hampi Resorts</span>
            </h1>
            <p className="text-navy-950/60 mb-10 leading-relaxed text-lg font-medium">
              Hello {user?.name}! We're thrilled to have you as a partner. To start welcoming guests to your sanctuary, let's set up your resort details.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button size="lg" className="rounded-2xl px-10 py-6 text-lg shadow-gold transition-transform hover:scale-105" onClick={() => navigate("/dashboard/resort-setup")}>
                List Your Resort Now
              </Button>
              <Button variant="outline" size="lg" className="rounded-2xl px-10 py-6 text-lg border-navy-200 text-navy-950 hover:bg-navy-50">
                View Partner Guide
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-6">
        {/* Multi-resort Switcher (if more than one) */}
        {resorts.length > 1 && (
          <div className="flex gap-2 mb-8 p-1.5 bg-white rounded-2xl border border-sand-100 w-fit">
            {resorts.map((r, idx) => (
              <button key={r.id} onClick={() => setActiveResortIdx(idx)}
                className={cn("px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeResortIdx === idx ? "bg-navy-950 text-white shadow" : "text-navy-950/40 hover:text-navy-950")}>
                {r.name}
              </button>
            ))}
          </div>
        )}

        <ProfileIncompleteBanner />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-serif font-bold text-navy-950">{resort.name}</h1>
              <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-1.5",
                resort.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100" : 
                resort.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" :
                "bg-gold-50 text-gold-700 border-gold-100")}>
                {resort.status === "APPROVED" ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {resort.status}
              </span>
            </div>
            <p className="text-navy-950/50 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {resort.locationArea}, Hampi • <span className="text-gold-600 font-medium capitalize">{resort.category || resort.type}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              className="rounded-xl border-sand-200 text-navy-950 whitespace-nowrap"
              onClick={() => navigate("/dashboard/inventory")}
            >
              <CalIcon className="w-4 h-4 mr-2" /> Manage Pricing
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl border-sand-200 text-navy-950 whitespace-nowrap"
              onClick={() => navigate("/dashboard/profile")}
            >
              <Users className="w-4 h-4 mr-2" /> My Profile
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl border-sand-200 text-navy-950 whitespace-nowrap"
              onClick={() => navigate("/dashboard?tab=settings")}
            >
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button className="rounded-xl shadow-gold whitespace-nowrap" onClick={() => navigate("/dashboard/resort-setup")}>
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 whitespace-nowrap"
              onClick={async () => {
                if (window.confirm("Are you sure you want to permanently delete this resort and all its data? This cannot be undone.")) {
                  try {
                    const res = await fetch(`http://localhost:5000/api/resorts/${resort.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      setActiveResortIdx(0);
                      fetchResorts();
                    } else {
                      alert("Failed to delete resort.");
                    }
                  } catch (err) {
                    alert("Network error.");
                  }
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Property
            </Button>
          </div>
        </div>

        {/* Status Message */}
        {resort.status === "PENDING" && (
          <div className="mb-10 p-6 bg-gold-50 rounded-[2rem] border border-gold-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-gold-200">
              <Loader2 className="w-6 h-6 text-gold-600 animate-spin" />
            </div>
            <div>
              <p className="font-bold text-navy-950">Under Review</p>
              <p className="text-sm text-navy-950/60 mt-0.5">Our admin team is verifying your resort details. Once approved, your sanctuary will be visible to thousands of travellers.</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              onClick={stat.onClick}
              className={cn("bg-white p-6 rounded-[2rem] border border-sand-100 shadow-sm transition-all", stat.onClick && "cursor-pointer hover:border-gold-300 hover:shadow-md")}>
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">{stat.trend}</span>
              </div>
              <p className="text-sm font-medium text-navy-950/40 mb-1">{stat.label}</p>
              <p className="text-3xl font-serif font-bold text-navy-950">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Daily Activity Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Arrivals Today */}
          <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-sand-100 bg-green-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-navy-950">Today's Arrivals</h3>
                <p className="text-xs text-green-700 font-bold uppercase tracking-widest mt-1">Checking in Today</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-green-100 flex items-center justify-center text-green-600 shadow-sm">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="p-8 space-y-4">
              {resort?.bookings?.filter((b: any) => {
                const today = new Date().toDateString();
                return new Date(b.checkIn).toDateString() === today && b.status !== 'CANCELLED';
              }).length > 0 ? (
                resort.bookings.filter((b: any) => {
                  const today = new Date().toDateString();
                  return new Date(b.checkIn).toDateString() === today && b.status !== 'CANCELLED';
                }).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-5 rounded-2xl bg-sand-50/50 border border-sand-100 hover:border-green-300 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-navy-950 border border-sand-200">
                        {booking.user?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-950">{booking.user?.name}</p>
                        <p className="text-[10px] text-navy-950/40 font-bold uppercase tracking-widest">{booking.guests} Guests • {booking.status}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowBookingsModal(true)} className="h-8 rounded-lg text-[10px] px-3">Details</Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-navy-950/30 italic text-sm font-medium">No arrivals scheduled for today.</div>
              )}
            </div>
          </div>

          {/* Departures Today */}
          <div className="bg-white rounded-[2.5rem] border border-sand-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-sand-100 bg-red-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-navy-950">Today's Departures</h3>
                <p className="text-xs text-red-700 font-bold uppercase tracking-widest mt-1">Checking out Today</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-red-100 flex items-center justify-center text-red-600 shadow-sm">
                <ChevronRight className="rotate-180 w-6 h-6" />
              </div>
            </div>
            <div className="p-8 space-y-4">
              {resort?.bookings?.filter((b: any) => {
                const today = new Date().toDateString();
                return new Date(b.checkOut).toDateString() === today && b.status !== 'CANCELLED';
              }).length > 0 ? (
                resort.bookings.filter((b: any) => {
                  const today = new Date().toDateString();
                  return new Date(b.checkOut).toDateString() === today && b.status !== 'CANCELLED';
                }).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-5 rounded-2xl bg-sand-50/50 border border-sand-100 hover:border-red-300 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-navy-950 border border-sand-200">
                        {booking.user?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-950">{booking.user?.name}</p>
                        <p className="text-[10px] text-navy-950/40 font-bold uppercase tracking-widest">{booking.guests} Guests • Room {booking.id.slice(-4).toUpperCase()}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] px-3 border-red-200 text-red-600 hover:bg-red-50">Invoice</Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-navy-950/30 italic text-sm font-medium">No departures scheduled for today.</div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className={cn("lg:col-span-8 space-y-10", activeTab === "overview" ? "block" : "hidden lg:block")}>
            {(activeTab === "overview" || activeTab === "properties") && (
              <>
                {/* Room Inventory */}
                <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-sand-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-navy-950">Room Inventory</h2>
                      <p className="text-sm text-navy-950/40 mt-1">Manage your room types, pricing and availability.</p>
                    </div>
                    <Button size="sm" className="rounded-xl px-5" onClick={() => setShowAddRoom(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Room Type
                    </Button>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {resort.roomTypes?.map((room: any) => (
                        <div key={room.id} className="p-6 rounded-[2.5rem] border-2 border-sand-50 bg-sand-50/30 hover:border-gold-200 transition-all group">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-xl font-bold text-navy-950">{room.name}</h4>
                            <span className="text-gold-600 font-bold">₹{room.pricePerNight?.toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-navy-950/50 mb-6 line-clamp-2 italic">{room.description}</p>
                          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-navy-950/40">
                            <span className="flex items-center gap-2"><Users className="w-4 h-4" /> Max {room.capacity}</span>
                            <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {room.availableCount} Available</span>
                          </div>
                          
                          {/* Room Photos Manager */}
                          <div className="mt-6 pt-6 border-t border-sand-100">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/30 mb-3">Room Gallery</p>
                            <div className="flex flex-wrap gap-2">
                              {room.images?.map((img: string, i: number) => (
                                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                                  <img src={img} className="w-full h-full object-cover" />
                                  <button 
                                    onClick={async () => {
                                      if (window.confirm("Delete this room photo?")) {
                                        try {
                                          await fetch(`http://localhost:5000/api/rooms/${room.id}/photos`, {
                                            method: "DELETE",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ url: img })
                                          });
                                          fetchResorts();
                                        } catch (err) { alert("Error deleting photo"); }
                                      }
                                    }}
                                    className="absolute inset-0 bg-red-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                  >
                                    <Trash2 className="w-4 h-4 text-white" />
                                  </button>
                                </div>
                              ))}
                              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-sand-200 flex items-center justify-center text-navy-950/20 hover:border-gold-300 hover:text-gold-500 transition-all cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                    try {
                                      const r1 = await fetch(`http://localhost:5000/api/rooms/${room.id}/photos`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ url: reader.result as string })
                                      });
                                      if (r1.ok) {
                                        fetchResorts();
                                      } else {
                                        if (r1.status === 413) {
                                          alert("Image is too large! Please restart the backend server so the new 50MB limit takes effect, or use a smaller image.");
                                        } else {
                                          alert("Failed to upload room photo. Server returned status: " + r1.status);
                                        }
                                      }
                                    } catch(err) {
                                      alert("Network error: Make sure your backend server is running on port 5000!");
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }} />
                                <Plus className="w-5 h-5" />
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Property Gallery */}
                <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm overflow-hidden">
                  <div className="p-8 border-b border-sand-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-serif text-navy-950">Property Gallery</h3>
                      <p className="text-sm text-navy-950/40 mt-1">Manage the high-resolution photos shown to guests.</p>
                    </div>
                    <div className="flex gap-2">
                      <label className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-colors bg-navy-950 text-white hover:bg-navy-900/90 h-10 px-4 cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
                        <input type="file" accept="image/*" className="hidden" disabled={isUpdatingResortPhotos} onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUpdatingResortPhotos(true);
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            try {
                              const res = await fetch(`http://localhost:5000/api/resorts/${resort.id}/photos`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ url: reader.result as string })
                              });
                              if (res.ok) {
                                fetchResorts();
                              } else {
                                if (res.status === 413) {
                                  alert("Image is too large! Please restart the backend server so the new 50MB limit takes effect, or use a smaller image (under 100kb).");
                                } else {
                                  alert("Failed to upload image. Server returned status: " + res.status);
                                }
                              }
                            } catch(err) {
                              alert("Network error: Make sure your backend server is running on port 5000!");
                            } finally {
                              setIsUpdatingResortPhotos(false);
                            }
                          };
                          reader.readAsDataURL(file);
                        }} />
                        {isUpdatingResortPhotos ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Add Photo"}
                      </label>
                    </div>
                  </div>
                  <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {resort.images?.map((img: string, i: number) => (
                      <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                        <img src={img} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            if (window.confirm("Delete this property photo?")) {
                              handleDeletePhoto(resort.id, img);
                            }
                          }} 
                          className="absolute top-3 right-3 p-2.5 bg-white/90 rounded-xl text-red-500 shadow-lg transition-all hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "bookings" && (
              <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-serif font-bold text-navy-950">Manage Bookings</h2>
                </div>
                <div className="space-y-4">
                  {(resort.bookings || []).length > 0 ? (
                    (resort.bookings || []).map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-6 rounded-[2rem] border border-sand-50 bg-sand-50/30">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center font-bold text-navy-950 border border-sand-200">
                            {booking.user?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-lg font-bold text-navy-950">{booking.user?.name}</p>
                            <p className="text-xs text-navy-950/40 uppercase tracking-widest">
                              {new Date(booking.checkIn).toLocaleDateString()} — {booking.guests} Guests
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                            booking.status === "CONFIRMED" ? "bg-green-50 text-green-700 border-green-100" :
                            booking.status === "CANCELLED" ? "bg-red-50 text-red-700 border-red-100" :
                            "bg-gold-50 text-gold-700 border-gold-100")}>
                            {booking.status}
                          </span>
                          {booking.status === "PENDING" && (
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" onClick={() => handleBookingAction(booking.id, 'confirm')} className="bg-green-600 hover:bg-green-700">Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => handleBookingAction(booking.id, 'reject')} className="border-red-200 text-red-600 hover:bg-red-50">Reject</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 text-navy-950/30 italic">No bookings yet.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-12">
                <h2 className="text-2xl font-serif font-bold text-navy-950 mb-8">Business Settings</h2>
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <Input label="Business Name" value={resort.name} readOnly />
                    <Input label="GST Number" placeholder="Not set" />
                  </div>
                  <Input label="Business Email" value={user?.email} readOnly />
                  <div className="pt-4">
                    <Button className="rounded-2xl px-10">Save Changes</Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className={cn("lg:col-span-4 space-y-10", (activeTab !== "overview" && activeTab !== "properties") ? "hidden lg:block" : "block")}>
            {/* Recent Activity */}
            <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-serif font-bold text-navy-950">Recent Stays</h3>
                <button onClick={() => setShowBookingsModal(true)} className="text-xs font-bold text-gold-600 uppercase tracking-widest hover:text-gold-700">View All</button>
              </div>
              <div className="space-y-6">
                {(resort.bookings?.length > 0 ? resort.bookings : []).slice(0, 4).map((booking: any) => (
                  <div key={booking.id} className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-sand-50 flex items-center justify-center font-bold text-navy-950 border border-sand-100 group-hover:border-gold-300 transition-all">
                      {booking.user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-navy-950">{booking.user?.name}</p>
                      <p className="text-[10px] text-navy-950/40 uppercase tracking-widest">
                        {new Date(booking.checkIn).toLocaleDateString()} • {booking.status}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-sand-300 group-hover:text-gold-500 transition-all" />
                  </div>
                ))}
                {(!resort.bookings || resort.bookings.length === 0) && (
                  <div className="text-center py-6 text-navy-950/30 italic text-sm">No bookings yet</div>
                )}
              </div>
            </div>

            {/* Meal Packages Display */}
            <div className="bg-navy-950 rounded-[3rem] p-8 text-white">
              <h3 className="text-xl font-serif font-bold mb-6">Meal Packages</h3>
              <div className="space-y-4">
                {(resort.mealPackages || []).map((pkg: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl border border-white/10 bg-white/5">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold">{pkg.name}</p>
                      <span className="text-gold-400 font-bold">₹{pkg.price}</span>
                    </div>
                    <p className="text-[10px] text-white/40 italic">{pkg.description}</p>
                  </div>
                ))}
                {(!resort.mealPackages || resort.mealPackages.length === 0) && (
                  <p className="text-xs text-white/30 italic text-center py-4">No meal packages defined</p>
                )}
                <Button variant="outline" className="w-full rounded-xl border-white/20 text-white hover:bg-white hover:text-navy-950 mt-4">
                  Manage Dining
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Room Type Modal */}
      <AnimatePresence>
        {showAddRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setShowAddRoom(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[3rem] p-8 md:p-12 max-w-2xl w-full shadow-luxury">
              <h2 className="text-3xl font-serif font-bold text-navy-950 mb-8">Add New Room Type</h2>
              <form onSubmit={handleAddRoom} className="space-y-6">
                <Input label="Room Type Name" placeholder="e.g. Royal Heritage Suite" value={roomFormData.name} onChange={e => setRoomFormData(p => ({...p, name: e.target.value}))} />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-navy-800/40 uppercase tracking-widest ml-1">Room Description</label>
                  <textarea rows={3} className="w-full bg-sand-50 border border-sand-200 rounded-2xl p-4 focus:ring-2 focus:ring-gold-500/20 outline-none resize-none"
                    placeholder="Describe the amenities, view, and layout..." value={roomFormData.description} onChange={e => setRoomFormData(p => ({...p, description: e.target.value}))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Price / Night (₹)" type="number" value={roomFormData.pricePerNight} onChange={e => setRoomFormData(p => ({...p, pricePerNight: e.target.value}))} />
                  <Input label="Max Guests" type="number" value={roomFormData.capacity} onChange={e => setRoomFormData(p => ({...p, capacity: e.target.value}))} />
                  <Input label="Total Rooms" type="number" value={roomFormData.availableCount} onChange={e => setRoomFormData(p => ({...p, availableCount: e.target.value}))} />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1 rounded-2xl py-6" onClick={() => setShowAddRoom(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 rounded-2xl py-6 shadow-gold" isLoading={isAddingRoom}>Create Room Type</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* All Bookings Modal */}
      <AnimatePresence>
        {showBookingsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setShowBookingsModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[3rem] p-8 md:p-12 max-w-4xl w-full shadow-luxury max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-navy-950">Guest Command Center</h2>
                  <p className="text-sm text-navy-950/40 mt-1">Manage all reservations and guest special requests.</p>
                </div>
                <button onClick={() => setShowBookingsModal(false)} className="w-12 h-12 bg-sand-50 rounded-full flex items-center justify-center text-navy-950/40 hover:bg-gold-50 hover:text-gold-600 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="overflow-y-auto pr-2 space-y-6 flex-grow scrollbar-hide">
                {(resort.bookings || []).length > 0 ? (
                  (resort.bookings || []).map((booking: any) => (
                    <div key={booking.id} className="p-8 rounded-[2.5rem] border border-sand-100 bg-white hover:border-gold-300 hover:shadow-xl transition-all group">
                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Guest Profile Info */}
                        <div className="w-full md:w-1/3 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-navy-950 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                              {booking.user?.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-lg font-bold text-navy-950">{booking.user?.name}</p>
                              <p className="text-[10px] font-bold text-gold-600 uppercase tracking-widest">{booking.referenceNumber}</p>
                            </div>
                          </div>
                          <div className="p-4 rounded-2xl bg-sand-50/50 border border-sand-100 space-y-2">
                            <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">Contact Info</p>
                            <p className="text-xs font-bold text-navy-950">{booking.user?.email}</p>
                            <p className="text-xs text-navy-950/60 font-medium">+91 98765 43210</p>
                          </div>
                          <div className="flex gap-2">
                             <Button variant="outline" size="sm" className="flex-1 rounded-xl text-[10px] h-10 border-sand-200">Message</Button>
                             <Button variant="outline" size="sm" className="flex-1 rounded-xl text-[10px] h-10 border-sand-200">History</Button>
                          </div>
                        </div>

                        {/* Booking & Requests Details */}
                        <div className="flex-grow space-y-6">
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">Check-In</p>
                              <p className="text-sm font-bold text-navy-950">{new Date(booking.checkIn).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">Check-Out</p>
                              <p className="text-sm font-bold text-navy-950">{new Date(booking.checkOut).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">Guests</p>
                              <p className="text-sm font-bold text-navy-950">{booking.guests} People</p>
                            </div>
                          </div>

                          {/* Special Requests Section */}
                          <div className="p-6 rounded-3xl bg-gold-50/50 border border-gold-100 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-16 h-16 bg-gold-500/5 rounded-full blur-xl -mr-8 -mt-8" />
                             <p className="text-[10px] font-bold text-gold-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                               <AlertCircle className="w-3.5 h-3.5" /> Guest Special Requests
                             </p>
                             <p className="text-sm text-navy-950/70 font-medium italic">
                               {booking.specialRequests || "No special requests mentioned by the guest for this stay."}
                             </p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-sand-100">
                             <div>
                               <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-1">Status & Payment</p>
                               <div className="flex items-center gap-3">
                                 <span className={cn("px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                                   booking.status === "CONFIRMED" ? "bg-green-50 text-green-700 border-green-100" :
                                   booking.status === "CANCELLED" ? "bg-red-50 text-red-700 border-red-100" :
                                   "bg-gold-50 text-gold-700 border-gold-100")}>
                                   {booking.status}
                                 </span>
                                 <p className="text-lg font-serif font-bold text-navy-950">₹{booking.totalPrice?.toLocaleString("en-IN")}</p>
                               </div>
                             </div>
                             
                             <div className="flex gap-3">
                               {booking.status === "PENDING" && (
                                 <>
                                   <Button size="sm" variant="outline" onClick={() => handleBookingAction(booking.id, 'reject')} className="rounded-xl px-6 border-red-100 text-red-600 hover:bg-red-50">Decline</Button>
                                   <Button size="sm" onClick={() => handleBookingAction(booking.id, 'confirm')} className="rounded-xl px-8 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20">Accept Request</Button>
                                 </>
                               )}
                               {booking.status === "CONFIRMED" && (
                                 <Button variant="outline" onClick={() => handleDownloadInvoice(booking)} className="rounded-xl border-sand-200">Generate Invoice</Button>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-sand-50/50 rounded-[3rem] border-2 border-dashed border-sand-200">
                    <CalIcon className="w-12 h-12 text-sand-300 mx-auto mb-4" />
                    <p className="text-lg font-serif font-bold text-navy-950/40">No active reservations found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
