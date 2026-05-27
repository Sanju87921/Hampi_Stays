import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Image as ImageIcon, Map, Search, ChevronRight, Megaphone, Calendar as CalendarIcon, Star, Eye, EyeOff, ChevronUp, ChevronDown, Play, Pause, Pencil, Check, X, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface HeroSlide { id: number; src: string; label: string; enabled: boolean; }

const DEFAULT_SLIDES: HeroSlide[] = [
  { id: 0, src: '/images/hero.png', label: 'The Sacred Virupaksha Temple', enabled: true },
  { id: 1, src: '/images/hampi-1.png', label: 'The Sacred Stone Chariot', enabled: true },
  { id: 2, src: '/images/hampi-2.png', label: 'Virupaksha Temple Gateway', enabled: true },
  { id: 3, src: '/images/hampi-3.png', label: 'Ancient Granite Boulders', enabled: true },
  { id: 4, src: '/images/hampi-4.png', label: 'The Royal Lotus Mahal', enabled: true },
  { id: 5, src: '/images/hampi-5.png', label: "Anjanadri Hill — Hanuman's Birthplace", enabled: true },
  { id: 6, src: '/images/hampi-6.png', label: 'Tungabhadra River Twilight', enabled: true },
];

const HeroModule = () => {
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES);
  const [rotationSpeed, setRotationSpeed] = useState(3);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const activeSlides = slides.filter(s => s.enabled);

  useEffect(() => {
    if (!previewPlaying || activeSlides.length === 0) return;
    const t = setInterval(() => setPreviewIdx(i => (i + 1) % activeSlides.length), rotationSpeed * 1000);
    return () => clearInterval(t);
  }, [previewPlaying, activeSlides.length, rotationSpeed]);

  const toggle = (id: number) => {
    const s = slides.find(x => x.id === id)!;
    if (s.enabled && activeSlides.length <= 2) { toast.error('Minimum 2 slides required'); return; }
    setSlides(slides.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= slides.length) return;
    const n = [...slides]; [n[idx], n[t]] = [n[t], n[idx]];
    setSlides(n);
  };

  const startEdit = (s: HeroSlide) => { setEditingId(s.id); setEditLabel(s.label); };
  const saveEdit = () => {
    if (!editLabel.trim()) return;
    setSlides(slides.map(x => x.id === editingId ? { ...x, label: editLabel.trim() } : x));
    setEditingId(null); toast.success('Label updated');
  };

  const handleSave = () => {
    localStorage.setItem('hampi_hero_config', JSON.stringify({ slides, rotationSpeed }));
    toast.success('Hero configuration saved');
  };

  return (
    <div className="space-y-8">
      {/* Live Preview */}
      <div className="rounded-2xl overflow-hidden border border-sand-200 bg-navy-950 relative h-[260px] md:h-[320px]">
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gold-400" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Live Preview</span>
        </div>
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button onClick={() => { setPreviewPlaying(!previewPlaying); if (!previewPlaying) setPreviewIdx(0); }}
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-2 rounded-xl hover:bg-white/20 transition-colors">
            {previewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
        {activeSlides.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div key={previewIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
              <img src={activeSlides[previewIdx % activeSlides.length]?.src} alt="" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/20 to-navy-950/40" />
              <div className="absolute bottom-6 left-6 z-10">
                <p className="text-[10px] font-bold text-gold-400 uppercase tracking-widest mb-1">Discover</p>
                <p className="text-white font-serif italic text-lg">{activeSlides[previewIdx % activeSlides.length]?.label}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        {/* Dots */}
        <div className="absolute bottom-6 right-6 z-10 flex gap-1.5">
          {activeSlides.map((_, i) => (
            <button key={i} onClick={() => { setPreviewIdx(i); setPreviewPlaying(false); }}
              className={`w-2 h-2 rounded-full transition-all ${i === previewIdx % activeSlides.length ? 'bg-gold-400 w-6' : 'bg-white/40'}`} />
          ))}
        </div>
      </div>

      {/* Rotation Speed */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-sand-50 rounded-2xl p-5 border border-sand-200">
        <div>
          <p className="text-sm font-bold text-navy-950">Rotation Speed</p>
          <p className="text-xs text-navy-950/50">Time each slide is displayed before transitioning</p>
        </div>
        <div className="flex items-center gap-3">
          {[2, 3, 4, 5, 7].map(s => (
            <button key={s} onClick={() => setRotationSpeed(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${rotationSpeed === s ? 'bg-navy-950 text-white shadow-md' : 'bg-white text-navy-950/60 border border-sand-200 hover:bg-sand-100'}`}>
              {s}s
            </button>
          ))}
        </div>
      </div>

      {/* Slide Manager */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-navy-950">{slides.length} Slides · {activeSlides.length} Active</p>
          <button onClick={handleSave} className="bg-navy-950 hover:bg-gold-600 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-lg">
            Save Config
          </button>
        </div>
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <motion.div key={slide.id} layout className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${slide.enabled ? 'bg-white border-sand-200' : 'bg-sand-50/50 border-sand-100 opacity-60'}`}>
              {/* Thumbnail */}
              <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-sand-200 relative">
                <img src={slide.src} alt="" className="w-full h-full object-cover" />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-navy-950/70 backdrop-blur text-gold-400 text-[8px] font-bold rounded-md">#{idx + 1}</div>
              </div>
              {/* Label */}
              <div className="flex-1 min-w-0">
                {editingId === slide.id ? (
                  <div className="flex items-center gap-2">
                    <input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="flex-1 text-sm font-medium text-navy-950 bg-sand-50 border border-sand-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400" autoFocus />
                    <button onClick={saveEdit} className="p-1.5 bg-emerald-500 text-white rounded-lg"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-sand-200 text-navy-950 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-navy-950 truncate">{slide.label}</p>
                    <button onClick={() => startEdit(slide)} className="p-1 text-navy-950/30 hover:text-gold-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <p className="text-[10px] text-navy-950/40 mt-0.5">{slide.src}</p>
              </div>
              {/* Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-sand-100 disabled:opacity-20 transition-colors"><ChevronUp className="w-4 h-4 text-navy-950/50" /></button>
                <button onClick={() => move(idx, 1)} disabled={idx === slides.length - 1} className="p-1.5 rounded-lg hover:bg-sand-100 disabled:opacity-20 transition-colors"><ChevronDown className="w-4 h-4 text-navy-950/50" /></button>
                <button onClick={() => toggle(slide.id)}
                  className={`p-1.5 rounded-lg transition-colors ${slide.enabled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-sand-100 text-navy-950/30 hover:bg-sand-200'}`}>
                  {slide.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CurationDashboard = () => {
  const [activeTab, setActiveTab] = useState('featured');

  const tabs = [
    { id: 'featured', label: 'Featured Resorts', icon: <Crown className="w-4 h-4" /> },
    { id: 'hero', label: 'Homepage Hero', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'campaigns', label: 'Seasonal Campaigns', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'sponsored', label: 'Sponsored Ads', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'experiences', label: 'Experiences', icon: <Map className="w-4 h-4" /> },
    { id: 'search', label: 'Search Ranking', icon: <Search className="w-4 h-4" /> },
  ];

  const renderContent = () => {
    if (activeTab === 'featured') {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="bg-sand-50 rounded-2xl border border-sand-200 overflow-hidden">
              <div className="h-40 bg-sand-200 relative">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Resort" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 px-3 py-1 bg-navy-950/80 backdrop-blur text-gold-400 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Slot 1
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-navy-950 mb-1">Evolve Back Kamalapura</h4>
                <p className="text-xs text-navy-950/50 mb-4">Expires: Dec 31, 2026</p>
                <button className="w-full py-2 border border-sand-300 rounded-xl text-xs font-bold text-navy-950 hover:bg-sand-100 transition-colors">Replace Resort</button>
              </div>
            </div>
            <div className="bg-sand-50 rounded-2xl border border-sand-200 overflow-hidden">
              <div className="h-40 bg-sand-200 relative">
                <img src="https://images.unsplash.com/photo-1542314831-c6a4d14d8c85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Resort" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 px-3 py-1 bg-navy-950/80 backdrop-blur text-gold-400 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Slot 2
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-navy-950 mb-1">Heritage Resort Hampi</h4>
                <p className="text-xs text-navy-950/50 mb-4">Expires: Nov 15, 2026</p>
                <button className="w-full py-2 border border-sand-300 rounded-xl text-xs font-bold text-navy-950 hover:bg-sand-100 transition-colors">Replace Resort</button>
              </div>
            </div>
            <div className="bg-sand-50/50 rounded-2xl border-2 border-dashed border-sand-200 flex flex-col items-center justify-center p-6 h-[280px] hover:bg-sand-50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gold-500 mb-3 group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy-950 mb-1">Empty Slot</h4>
              <p className="text-xs text-navy-950/50 text-center max-w-[150px]">Select a resort to feature on the homepage.</p>
            </div>
          </div>
        </div>
      );
    }
    if (activeTab === 'hero') {
      return (
        <div className="relative">
          <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
            <span className="px-3 py-1 bg-gold-100/80 text-gold-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-gold-200">Coming Soon</span>
          </div>
          <div className="opacity-60 pointer-events-none">
            <HeroModule />
          </div>
        </div>
      );
    }
    // Coming Soon for other tabs
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
        <div className="w-20 h-20 bg-sand-100 rounded-full flex items-center justify-center mb-6 text-navy-950/20">
          {tabs.find(t => t.id === activeTab)?.icon}
        </div>
        <h3 className="text-xl font-bold text-navy-950 mb-2">Module Under Construction</h3>
        <p className="text-navy-950/60 text-sm mb-6">
          The backend logic for {tabs.find(t => t.id === activeTab)?.label} is currently being upgraded for enterprise scale.
        </p>
        <span className="px-4 py-1.5 bg-gold-100 text-gold-700 text-[10px] font-bold uppercase tracking-widest rounded-full">Coming Soon</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-sand-50/50 pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/dashboard" className="text-xs font-bold uppercase tracking-widest text-navy-950/40 hover:text-gold-600 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3 h-3 text-navy-950/40" />
              <span className="text-xs font-bold uppercase tracking-widest text-gold-600">Curation Mode</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-950 mb-3">
              Marketplace <span className="text-gold-500 italic">Curation</span>
            </h1>
            <p className="text-navy-950/60 max-w-2xl">Govern the platform's visual hierarchy, manage sponsored placements, and control the luxury brand narrative.</p>
          </div>
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-sand-200 shadow-sm">
            <Sparkles className="w-5 h-5 text-gold-500" />
            <div>
              <p className="text-xs font-bold text-navy-950 uppercase tracking-widest">Live Mode</p>
              <p className="text-[10px] text-emerald-600 font-medium">Changes reflect instantly</p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-[2.5rem] border border-sand-200 shadow-luxury overflow-hidden sticky top-28">
              <div className="p-6 border-b border-sand-100 bg-sand-50/30">
                <p className="text-[11px] font-bold text-navy-950 uppercase tracking-widest">Curation Modules</p>
              </div>
              <div className="p-3 flex flex-col gap-1">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm ${activeTab === tab.id ? 'bg-navy-950 text-white shadow-md' : 'text-navy-950/60 hover:bg-sand-50 hover:text-navy-950'}`}>
                    <span className={activeTab === tab.id ? 'text-gold-400' : 'text-navy-950/40'}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
              className="bg-white rounded-[2.5rem] border border-sand-200 shadow-sm min-h-[600px] flex flex-col">
              <div className="p-8 border-b border-sand-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-sand-50/20 rounded-t-[2.5rem]">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-navy-950 mb-1">{tabs.find(t => t.id === activeTab)?.label}</h2>
                  <p className="text-sm text-navy-950/50">Configure and manage active placements.</p>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">{renderContent()}</div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurationDashboard;
