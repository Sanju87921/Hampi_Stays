import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, 
  Lock, Trash2, 
  Tag, Info, Loader2, Save, RefreshCw
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { cn } from "../../utils/cn";
import { apiClient } from "../../utils/apiClient";

export function InventoryPage() {
  const { user } = useAuth();
  const [resorts, setResorts] = useState<any[]>([]);
  const [activeResortIdx] = useState(0);
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Selection state
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [overridePrice, setOverridePrice] = useState("");
  const [minNights, setMinNights] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const fetchResorts = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await apiClient.get<any[]>(`/owners/${user.id}/resorts`);
      setResorts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResorts();
    // Pulse: Refresh inventory every 30 seconds for real-time synchronization
    const pulse = setInterval(fetchResorts, 30000);
    return () => clearInterval(pulse);
  }, [user]);

  const resort = resorts[activeResortIdx];
  const room = resort?.roomTypes?.[activeRoomIdx];

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const toggleDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDates(prev => {
      const exists = prev.find(d => d.toDateString() === date.toDateString());
      if (exists) return prev.filter(d => d.toDateString() !== date.toDateString());
      return [...prev, date];
    });
  };

  const handleApplyPrice = async () => {
    if (!room || selectedDates.length === 0 || !overridePrice) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/rooms/${room.id}/price-overrides`, {
        dates: selectedDates,
        price: parseFloat(overridePrice),
        minNights: minNights ? parseInt(minNights) : null
      });
      alert("Pricing & Rules updated successfully!");
      setSelectedDates([]);
      setOverridePrice("");
      setMinNights("");
      fetchResorts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlockDates = async () => {
    if (!room || selectedDates.length === 0) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/rooms/${room.id}/blockings`, {
        dates: selectedDates,
        reason: blockReason
      });
      alert("Dates blocked successfully!");
      setSelectedDates([]);
      setBlockReason("");
      fetchResorts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const [showDiscounts, setShowDiscounts] = useState(false);
  const [newDiscount, setNewDiscount] = useState<any>({
    code: "", percentage: "", flatAmount: "", validFrom: "", validUntil: "", maxUses: "",
    isEarlyBird: false, minDaysInAdvance: "", isLastMinute: false, maxDaysInAdvance: ""
  });

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resort) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/resorts/${resort.id}/discount-codes`, newDiscount);
      alert("Discount code created!");
      setShowDiscounts(false);
      setNewDiscount({ 
        code: "", percentage: "", flatAmount: "", validFrom: "", validUntil: "", maxUses: "",
        isEarlyBird: false, minDaysInAdvance: "", isLastMinute: false, maxDaysInAdvance: ""
      });
      fetchResorts();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center pt-24"><Loader2 className="w-10 h-10 animate-spin text-gold-600" /></div>;

  if (!resort) return <div className="min-h-screen flex items-center justify-center pt-24 text-navy-950/40">Please set up a resort first.</div>;

  return (
    <div className="min-h-screen bg-sand-50 pt-28 pb-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">Inventory & Pricing</h1>
            <p className="text-navy-950/50">Manage seasonal rates and block availability for <span className="text-gold-600 font-bold">{resort.name}</span>.</p>
          </div>
          <div className="flex gap-4">
            <select className="bg-white border border-sand-200 rounded-xl px-4 py-2 text-sm font-bold text-navy-950 outline-none"
              onChange={(e) => setActiveRoomIdx(parseInt(e.target.value))}>
              {resort.roomTypes?.map((r: any, i: number) => (
                <option key={r.id} value={i}>{r.name}</option>
              ))}
            </select>
            <Button variant="outline" className="rounded-xl gap-2 border-sand-200 text-navy-950" 
              onClick={async () => {
                setIsLoading(true);
                // Simulation: Mocking a sync with Google Calendar
                setTimeout(() => {
                  alert("Sync complete! 12 external dates imported from Google Calendar.");
                  setIsLoading(false);
                }, 1500);
              }}>
              <RefreshCw className="w-4 h-4" /> Sync Calendar
            </Button>
            <Button variant="outline" className="rounded-xl gap-2 border-gold-200 text-gold-700" onClick={() => setShowDiscounts(true)}>
              <Tag className="w-4 h-4" /> Discount Codes
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Calendar Section */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[3rem] border border-sand-100 shadow-luxury overflow-hidden">
              {/* Calendar Header */}
              <div className="p-8 border-b border-sand-100 flex items-center justify-between bg-sand-50/30">
                <h3 className="text-xl font-bold text-navy-950">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-sand-200 transition-all">
                    <ChevronLeft className="w-5 h-5 text-navy-950" />
                  </button>
                  <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-sand-200 transition-all">
                    <ChevronRight className="w-5 h-5 text-navy-950" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-8">
                <div className="grid grid-cols-7 gap-px bg-sand-100 border border-sand-100 rounded-2xl overflow-hidden">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                    <div key={d} className="bg-sand-50 p-4 text-center text-[10px] font-bold uppercase tracking-widest text-navy-950/40">
                      {d}
                    </div>
                  ))}
                  {paddingDays.map(d => <div key={`p-${d}`} className="bg-white h-24 md:h-32" />)}
                  {calendarDays.map(day => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isSelected = selectedDates.find(d => d.toDateString() === date.toDateString());
                    
                    const override = room?.priceOverrides?.find((o: any) => new Date(o.date).toDateString() === date.toDateString());
                    const blocking = room?.blockings?.find((b: any) => new Date(b.date).toDateString() === date.toDateString());
                    const currentPrice = override ? override.price : room?.pricePerNight;

                    return (
                      <button key={day} onClick={() => toggleDate(day)}
                        className={cn("bg-white h-24 md:h-32 p-4 text-left transition-all hover:bg-gold-50/30 relative group",
                          isSelected && "bg-gold-100 border-2 border-gold-500 z-10",
                          blocking && "bg-red-50/50 hover:bg-red-50/80")}>
                        <div className="flex justify-between items-start">
                          <span className={cn("text-sm font-bold", isSelected ? "text-gold-700" : (blocking ? "text-red-400" : "text-navy-950"))}>
                            {day}
                          </span>
                          {blocking && <Lock className="w-3 h-3 text-red-400" />}
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <p className={cn("text-[10px] font-bold", override ? "text-sunset-600" : "text-navy-950/30")}>
                            ₹{currentPrice?.toLocaleString()}
                          </p>
                          {override?.minNights && (
                            <p className="text-[8px] text-navy-800/40 font-bold uppercase tracking-tighter">Min {override.minNights}nt</p>
                          )}
                          {blocking?.reason && (
                            <p className="text-[8px] text-red-500 font-medium truncate">{blocking.reason}</p>
                          )}
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2 h-2 bg-gold-500 rounded-full" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-sand-100 p-8 shadow-sm">
              <h4 className="text-lg font-bold text-navy-950 mb-6 flex items-center gap-2">
                <Save className="w-5 h-5 text-gold-600" /> Quick Actions
              </h4>
              
              <div className="p-5 bg-sand-50 rounded-2xl border border-sand-100 mb-6">
                <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-2">Selected Dates</p>
                <p className="text-sm font-bold text-navy-950">
                  {selectedDates.length === 0 ? "Select dates from calendar" : `${selectedDates.length} days selected`}
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Override Price (₹)" type="number" value={overridePrice} onChange={e => setOverridePrice(e.target.value)} placeholder="e.g. 25000" />
                    <Input label="Min Nights" type="number" value={minNights} onChange={e => setMinNights(e.target.value)} placeholder="1" />
                  </div>
                  <Button className="w-full rounded-xl shadow-gold" disabled={selectedDates.length === 0 || !overridePrice} onClick={handleApplyPrice} isLoading={isSaving}>
                    Apply Seasonal Price
                  </Button>
                </div>

                <div className="pt-6 border-t border-sand-100 space-y-4">
                  <Input label="Blocking Reason" value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="e.g. Maintenance" />
                  <Button variant="outline" className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50" disabled={selectedDates.length === 0} onClick={handleBlockDates} isLoading={isSaving}>
                    <Lock className="w-4 h-4 mr-2" /> Block Selected Dates
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-navy-950 rounded-[2.5rem] p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-gold-500" />
                <h5 className="font-bold uppercase tracking-widest text-xs">Calendar Tips</h5>
              </div>
              <ul className="space-y-3 text-xs text-white/50 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                  Multi-select dates to apply bulk pricing.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                  Blocked dates will not be bookable by guests.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                  Weekend surcharges are highly recommended.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Management Modal */}
      <AnimatePresence>
        {showDiscounts && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={() => setShowDiscounts(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[3rem] p-8 md:p-12 max-w-3xl w-full shadow-luxury overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-navy-950 mb-2">Promotional Codes</h2>
                  <p className="text-navy-950/40">Create offers to attract more guests.</p>
                </div>
                <button onClick={() => setShowDiscounts(false)} className="p-2 hover:bg-sand-100 rounded-full transition-all">
                  <Trash2 className="w-6 h-6 text-navy-950" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Create Form */}
                <form onSubmit={handleCreateDiscount} className="space-y-6">
                  <Input label="Discount Code" placeholder="e.g. SUMMER20" value={newDiscount.code} onChange={e => setNewDiscount((p: any) => ({...p, code: e.target.value.toUpperCase()}))} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Percentage (%)" type="number" value={newDiscount.percentage} onChange={e => setNewDiscount((p: any) => ({...p, percentage: e.target.value}))} />
                    <Input label="Flat Off (₹)" type="number" value={newDiscount.flatAmount} onChange={e => setNewDiscount((p: any) => ({...p, flatAmount: e.target.value}))} />
                  </div>
                  
                  <div className="space-y-4 p-4 bg-sand-50 rounded-2xl border border-sand-100">
                    <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest">Special Deal Logic</p>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-navy-950">Early Bird Deal</label>
                      <input type="checkbox" checked={newDiscount.isEarlyBird} onChange={e => setNewDiscount((p: any) => ({...p, isEarlyBird: e.target.checked}))} />
                    </div>
                    {newDiscount.isEarlyBird && (
                      <Input label="Min Days in Advance" type="number" value={newDiscount.minDaysInAdvance} onChange={e => setNewDiscount((p: any) => ({...p, minDaysInAdvance: e.target.value}))} />
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-sand-200/50">
                      <label className="text-sm font-bold text-navy-950">Last Minute Deal</label>
                      <input type="checkbox" checked={newDiscount.isLastMinute} onChange={e => setNewDiscount((p: any) => ({...p, isLastMinute: e.target.checked}))} />
                    </div>
                    {newDiscount.isLastMinute && (
                      <Input label="Max Days in Advance" type="number" value={newDiscount.maxDaysInAdvance} onChange={e => setNewDiscount((p: any) => ({...p, maxDaysInAdvance: e.target.value}))} />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Valid From" type="date" value={newDiscount.validFrom} onChange={e => setNewDiscount((p: any) => ({...p, validFrom: e.target.value}))} />
                    <Input label="Valid Until" type="date" value={newDiscount.validUntil} onChange={e => setNewDiscount((p: any) => ({...p, validUntil: e.target.value}))} />
                  </div>
                  <Input label="Max Redemptions" type="number" value={newDiscount.maxUses} onChange={e => setNewDiscount((p: any) => ({...p, maxUses: e.target.value}))} />
                  <Button type="submit" className="w-full rounded-2xl py-6 shadow-gold" isLoading={isSaving}>Create Active Offer</Button>
                </form>

                {/* List of Active Codes */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-navy-950/40 ml-2">Active Offers</h4>
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {resort.discountCodes?.map((d: any) => (
                      <div key={d.id} className="p-5 rounded-2xl bg-sand-50 border border-sand-100 flex items-center justify-between group">
                        <div>
                          <p className="font-bold text-navy-950">{d.code}</p>
                          <p className="text-[10px] text-navy-950/40 uppercase tracking-widest">
                            {d.percentage ? `${d.percentage}% Off` : `₹${d.flatAmount} Off`} • Until {new Date(d.validUntil).toLocaleDateString()}
                          </p>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {(!resort.discountCodes || resort.discountCodes.length === 0) && (
                      <div className="text-center py-10 text-navy-950/20 italic text-sm">No active offers</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
