import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Backpack, Sun, Compass, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface HampiSurvivalWidgetProps {
  checkInDate: string;
}

export function HampiSurvivalWidget({ checkInDate }: HampiSurvivalWidgetProps) {
  // Check if check-in is within 3 days or today
  const isUpcoming = () => {
    const today = new Date();
    const checkIn = new Date(checkInDate);
    const diffTime = checkIn.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('hampi-survival-checklist');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'shoes', text: 'Grip shoes for Matanga Hill boulders', checked: false, icon: Backpack },
      { id: 'sun', text: 'Wide-brim hat & 50+ SPF sunscreen', checked: false, icon: Sun },
      { id: 'clothes', text: 'Light cottons & temple-appropriate wear', checked: false, icon: Compass },
      { id: 'cash', text: 'Cash (UPI fails in some heritage areas)', checked: false, icon: Backpack },
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('hampi-survival-checklist', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  if (!isUpcoming()) return null;

  const progress = Math.round((items.filter(i => i.checked).length / items.length) * 100);

  const getWeather = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return { temp: 38, desc: "Scorching Heat", icon: "☀️", tip: "Extreme heat. Hydrate constantly!" };
    if (month >= 5 && month <= 8) return { temp: 28, desc: "Monsoon Showers", icon: "🌧️", tip: "Rain expected. Bring an umbrella." };
    return { temp: 24, desc: "Pleasant & Breezy", icon: "🌤️", tip: "Perfect weather for boulder trekking." };
  };
  const weather = getWeather();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-navy-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-gold-500/20"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-serif font-bold text-gold-400 mb-1">Hampi Survival Kit</h3>
          <p className="text-xs text-white/60 font-medium">Your trip is in a few days. Are you packed?</p>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 shadow-sm backdrop-blur-sm">
          <Backpack className="w-6 h-6 text-gold-500" />
        </div>
      </div>

      {/* Dynamic Weather Integration */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Local Forecast</p>
          <p className="text-sm font-medium text-white">{weather.desc} — {weather.tip}</p>
        </div>
        <div className="flex flex-col items-center justify-center ml-4 shrink-0">
          <span className="text-2xl">{weather.icon}</span>
          <span className="text-gold-400 font-bold text-sm">{weather.temp}°C</span>
        </div>
      </div>

      <div className="mb-6 relative z-10">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">
          <span>Packing Progress</span>
          <span className="text-gold-400">{progress}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gold-500 rounded-full"
          />
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border text-left",
              item.checked 
                ? "bg-gold-500/10 border-gold-500/30 text-white shadow-sm" 
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
            )}
          >
            <div className={cn("shrink-0 transition-colors", item.checked ? "text-gold-400" : "text-white/40")}>
              {item.checked ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </div>
            <p className={cn("text-sm font-medium transition-all", item.checked && "line-through opacity-70")}>
              {item.text}
            </p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
