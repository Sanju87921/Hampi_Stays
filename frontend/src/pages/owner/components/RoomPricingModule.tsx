import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, IndianRupee, Plus, Trash2, Loader2, CalendarRange, Info } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface RoomPricingModuleProps {
  roomId: string;
  basePrice: number;
  roomName: string;
}

export function RoomPricingModule({ roomId, basePrice, roomName }: RoomPricingModuleProps) {
  const [overrides, setOverrides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newPrice, setNewPrice] = useState(basePrice.toString());
  const [minNights, setMinNights] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('list');

  useEffect(() => {
    fetchOverrides();
  }, [roomId]);

  const fetchOverrides = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/price-overrides`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch overrides');
      const data = await res.json();
      setOverrides(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !newPrice) return;
    
    setIsSubmitting(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }

      await Promise.all(dates.map(date => 
        fetch(`/api/rooms/${roomId}/price-overrides`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({
            date: date.toISOString(),
            price: parseFloat(newPrice),
            minNights: minNights ? parseInt(minNights) : null
          })
        })
      ));

      setStartDate('');
      setEndDate('');
      setNewPrice(basePrice.toString());
      setMinNights('');
      
      await fetchOverrides();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOverride = async (date: string) => {
    try {
      await fetch(`/api/rooms/${roomId}/price-overrides?date=${date}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setOverrides(prev => prev.filter(o => new Date(o.date).toISOString() !== new Date(date).toISOString()));
    } catch (err) {
      console.error(err);
    }
  };

  const groupOverrides = () => {
    // Basic grouping for consecutive dates with same price
    if (!overrides.length) return [];
    
    const sorted = [...overrides].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const groups: any[] = [];
    
    let currentGroup = { ...sorted[0], endDate: sorted[0].date };
    
    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      const prevDate = new Date(currentGroup.endDate);
      const currDate = new Date(curr.date);
      
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1 && curr.price === currentGroup.price) {
        currentGroup.endDate = curr.date;
      } else {
        groups.push(currentGroup);
        currentGroup = { ...curr, endDate: curr.date };
      }
    }
    groups.push(currentGroup);
    return groups;
  };

  const groupedOverrides = groupOverrides();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-gold-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-serif font-bold text-navy-950">Dynamic Pricing</h3>
        <p className="text-sm text-navy-950/40">Set custom rates for {roomName} during peak seasons, holidays, and Hampi festivals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <form onSubmit={handleAddOverride} className="bg-sand-50/50 p-6 rounded-[2rem] border border-sand-200 space-y-6">
            <h4 className="text-sm font-bold text-navy-950 uppercase tracking-widest flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-gold-500" /> Apply Surge Pricing
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-950/60 mb-2">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-sm focus:border-gold-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-950/60 mb-2">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-sm focus:border-gold-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-950/60 mb-2">New Nightly Rate</label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-navy-950/40" />
                  <input 
                    type="number" 
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-full bg-white border border-sand-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:border-gold-500 outline-none"
                    min={0}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-950/60 mb-2">Min. Nights <span className="opacity-50">(Optional)</span></label>
                <input 
                  type="number" 
                  value={minNights}
                  onChange={e => setMinNights(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full bg-white border border-sand-200 rounded-xl px-4 py-3 text-sm focus:border-gold-500 outline-none"
                  min={1}
                />
              </div>
            </div>

            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-xs flex items-start gap-3 border border-blue-100">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <p>Base price is <strong>₹{basePrice.toLocaleString()}</strong>. Your new rate will apply only to the selected dates.</p>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !startDate || !endDate || !newPrice}
              className="w-full h-12 bg-navy-950 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-navy-900 transition-colors disabled:opacity-50 shadow-luxury"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Apply Rule
            </button>
          </form>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2rem] border border-sand-200 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-sand-100 flex items-center justify-between bg-sand-50/30">
              <h4 className="text-sm font-bold text-navy-950 uppercase tracking-widest">Active Overrides</h4>
              <span className="bg-gold-100 text-gold-700 px-3 py-1 rounded-full text-[10px] font-bold">
                {groupedOverrides.length} Rules Active
              </span>
            </div>
            
            <div className="flex-grow p-6 overflow-y-auto space-y-4">
              {groupedOverrides.length > 0 ? (
                groupedOverrides.map((group, i) => {
                  const isSurge = group.price > basePrice;
                  const isDiscount = group.price < basePrice;
                  const sDate = new Date(group.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  const eDate = new Date(group.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i} 
                      className="flex items-center justify-between p-4 rounded-2xl border border-sand-200 hover:border-gold-300 transition-colors bg-white group-hover"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", 
                          isSurge ? "bg-red-50 text-red-600 border-red-100" : 
                          isDiscount ? "bg-green-50 text-green-600 border-green-100" : 
                          "bg-gold-50 text-gold-600 border-gold-100"
                        )}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy-950">
                            {sDate} {sDate !== eDate ? `— ${eDate}` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest", 
                              isSurge ? "text-red-600" : isDiscount ? "text-green-600" : "text-navy-950/40"
                            )}>
                              ₹{group.price.toLocaleString()} / night
                            </span>
                            {group.minNights && (
                              <span className="text-[9px] text-navy-950/30 px-2 py-0.5 bg-sand-100 rounded-md">
                                Min {group.minNights} Nights
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteOverride(group.date)}
                        className="w-10 h-10 rounded-xl bg-white border border-sand-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                        title="Remove Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-16 h-16 bg-sand-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="w-8 h-8 text-sand-300" />
                  </div>
                  <p className="text-sm font-bold text-navy-950">No Pricing Rules</p>
                  <p className="text-xs text-navy-950/40 mt-1 max-w-[200px]">Rooms will be booked at your base rate of ₹{basePrice.toLocaleString()}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
