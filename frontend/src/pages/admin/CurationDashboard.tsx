import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Crown, Image as ImageIcon, Map, Search, ChevronRight, Megaphone, Calendar as CalendarIcon, Star, Eye, EyeOff, ChevronUp, ChevronDown, Play, Pause, Pencil, Check, X, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import HeroModule from './HeroModule';
import SeasonalCampaignsModule from './curation/SeasonalCampaignsModule';
import SponsoredAdsModule from './curation/SponsoredAdsModule';
import CuratedExperiencesModule from './curation/CuratedExperiencesModule';
import SearchRankingModule from './curation/SearchRankingModule';

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
            <div className="bg-sand-50 dark:bg-zinc-950 rounded-2xl border border-sand-200 dark:border-zinc-800 overflow-hidden">
              <div className="h-40 bg-sand-200 dark:bg-zinc-800 relative">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Resort" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/hero.png'; }} />
                <div className="absolute top-3 left-3 px-3 py-1 bg-navy-950/80 backdrop-blur text-gold-400 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Slot 1
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-navy-950 dark:text-white mb-1">Evolve Back Kamalapura</h4>
                <p className="text-xs text-navy-950 dark:text-white/50 dark:text-zinc-400 mb-4">Expires: Dec 31, 2026</p>
                <button className="w-full py-2 border border-sand-300 rounded-xl text-xs font-bold text-navy-950 dark:text-white hover:bg-sand-100 dark:hover:bg-zinc-700 transition-colors">Replace Resort</button>
              </div>
            </div>
            <div className="bg-sand-50 dark:bg-zinc-950 rounded-2xl border border-sand-200 dark:border-zinc-800 overflow-hidden">
              <div className="h-40 bg-sand-200 dark:bg-zinc-800 relative">
                <img src="https://images.unsplash.com/photo-1542314831-c6a4d14d8c85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Resort" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/hampi-1.png'; }} />
                <div className="absolute top-3 left-3 px-3 py-1 bg-navy-950/80 backdrop-blur text-gold-400 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> Slot 2
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-navy-950 dark:text-white mb-1">Heritage Resort Hampi</h4>
                <p className="text-xs text-navy-950 dark:text-white/50 dark:text-zinc-400 mb-4">Expires: Nov 15, 2026</p>
                <button className="w-full py-2 border border-sand-300 rounded-xl text-xs font-bold text-navy-950 dark:text-white hover:bg-sand-100 dark:hover:bg-zinc-700 transition-colors">Replace Resort</button>
              </div>
            </div>
            <div className="bg-sand-50 dark:bg-zinc-950/50 rounded-2xl border-2 border-dashed border-sand-200 dark:border-zinc-800 flex flex-col items-center justify-center p-6 h-[280px] hover:bg-sand-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center text-gold-500 mb-3 group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-navy-950 dark:text-white mb-1">Empty Slot</h4>
              <p className="text-xs text-navy-950 dark:text-white/50 dark:text-zinc-400 text-center max-w-[150px]">Select a resort to feature on the homepage.</p>
            </div>
          </div>
        </div>
      );
    }
    if (activeTab === 'hero') {
      return <HeroModule />;    }
    if (activeTab === 'campaigns') {
      return <SeasonalCampaignsModule />;
    }
    if (activeTab === 'sponsored') {
      return <SponsoredAdsModule />;
    }
    if (activeTab === 'experiences') {
      return <CuratedExperiencesModule />;
    }
    if (activeTab === 'search') {
      return <SearchRankingModule />;
    }
    
    // Fallback for any other unexpected tab
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
        <h3 className="text-xl font-bold text-navy-950 dark:text-white mb-2">Module Under Construction</h3>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-zinc-950/50 pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/dashboard" className="text-xs font-bold uppercase tracking-widest text-navy-950 dark:text-white/40 dark:text-zinc-500 hover:text-gold-600 transition-colors">Dashboard</Link>
              <ChevronRight className="w-3 h-3 text-navy-950 dark:text-white/40 dark:text-zinc-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-gold-600">Curation Mode</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-950 dark:text-white mb-3">
              Marketplace <span className="text-gold-500 italic">Curation</span>
            </h1>
            <p className="text-navy-950 dark:text-white/60 dark:text-zinc-400 max-w-2xl">Govern the platform's visual hierarchy, manage sponsored placements, and control the luxury brand narrative.</p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-sand-200 dark:border-zinc-800 shadow-sm">
            <Sparkles className="w-5 h-5 text-gold-500" />
            <div>
              <p className="text-xs font-bold text-navy-950 dark:text-white uppercase tracking-widest">Live Mode</p>
              <p className="text-[10px] text-emerald-600 font-medium">Changes reflect instantly</p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-sand-200 dark:border-zinc-800 shadow-luxury overflow-hidden sticky top-28">
              <div className="p-6 border-b border-sand-100 dark:border-zinc-800/50 bg-sand-50 dark:bg-zinc-950/30">
                <p className="text-[11px] font-bold text-navy-950 dark:text-white uppercase tracking-widest">Curation Modules</p>
              </div>
              <div className="p-3 flex flex-col gap-1">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm ${activeTab === tab.id ? 'bg-navy-950 text-white shadow-md' : 'text-navy-950 dark:text-white/60 dark:text-zinc-400 hover:bg-sand-50 dark:hover:bg-zinc-800 hover:text-navy-950 dark:text-white'}`}>
                    <span className={activeTab === tab.id ? 'text-gold-400' : 'text-navy-950 dark:text-white/40 dark:text-zinc-500'}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-sand-200 dark:border-zinc-800 shadow-sm min-h-[600px] flex flex-col">
              <div className="p-8 border-b border-sand-100 dark:border-zinc-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-sand-50 dark:bg-zinc-950/20 rounded-t-[2.5rem]">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-navy-950 dark:text-white mb-1">{tabs.find(t => t.id === activeTab)?.label}</h2>
                  <p className="text-sm text-navy-950 dark:text-white/50 dark:text-zinc-400">Configure and manage active placements.</p>
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
