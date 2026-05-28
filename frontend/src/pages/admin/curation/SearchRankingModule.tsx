import React, { useState } from 'react';
import { Search, TrendingUp, SlidersHorizontal, ArrowUpCircle, ShieldCheck, Star, Activity, ArrowDownCircle, GripVertical } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import toast from 'react-hot-toast';

const SearchRankingModule = () => {
 const [activeTab, setActiveTab] = useState('algorithm');

 const algorithmWeights = [
 { id: 'luxury_score', name: 'Luxury Score Weighting', weight: 85, icon: <Star className="w-4 h-4" /> },
 { id: 'verified', name: 'Verified Resort Boost', weight: 90, icon: <ShieldCheck className="w-4 h-4" /> },
 { id: 'reviews', name: 'Review-based Ranking', weight: 75, icon: <TrendingUp className="w-4 h-4" /> },
 { id: 'seasonal', name: 'Seasonal Boosts', weight: 40, icon: <Activity className="w-4 h-4" /> },
 ];

 const manualPriorityList = [
 { id: '1', name: 'Evolve Back Kamalapura Palace', type: 'Heritage', score: 98, trend: 'up' },
 { id: '2', name: 'Heritage Resort Hampi', type: 'Luxury', score: 95, trend: 'up' },
 { id: '3', name: 'Boulders Resort', type: 'Nature', score: 91, trend: 'down' },
 { id: '4', name: 'Kishkinda Heritage Resort', type: 'Boutique', score: 88, trend: 'up' },
 ];

 const saveAlgorithm = () => {
 toast.success('Search algorithm weights updated successfully');
 };

 const saveOrdering = () => {
 toast.success('Manual priority ordering saved');
 };

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center bg-navy-950 p-6 rounded-2xl border border-navy-800 text-white">
 <div>
 <h3 className="font-bold text-xl flex items-center gap-2">
 <Search className="w-5 h-5 text-gold-500" /> Search Ranking Engine
 </h3>
 <p className="text-sm text-navy-200">Algolia-ready intelligence and manual discovery controls.</p>
 </div>
 <div className="flex bg-navy-900 rounded-xl p-1">
 <button onClick={() => setActiveTab('algorithm')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'algorithm' ? 'bg-navy-800 text-white' : 'text-navy-400 hover:text-white'}`}>Algorithm Weights</button>
 <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'manual' ? 'bg-navy-800 text-white' : 'text-navy-400 hover:text-white'}`}>Manual Priority</button>
 </div>
 </div>

 {activeTab === 'algorithm' && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white rounded-2xl border border-sand-200 p-6">
 <h4 className="font-bold text-navy-950 mb-6 flex items-center gap-2">
 <SlidersHorizontal className="w-5 h-5 text-gold-500" /> Core Discovery Algorithm
 </h4>
 <div className="space-y-6">
 {algorithmWeights.map(alg => (
 <div key={alg.id}>
 <div className="flex justify-between items-center mb-2">
 <div className="flex items-center gap-2 text-sm font-bold text-navy-950 ">
 <div className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center text-navy-600">{alg.icon}</div>
 {alg.name}
 </div>
 <span className="text-xs font-mono font-bold text-gold-600">{alg.weight}%</span>
 </div>
 <div className="h-2 bg-sand-100 rounded-full overflow-hidden">
 <div className="h-full bg-navy-950 rounded-full" style={{ width: `${alg.weight}%` }}></div>
 </div>
 </div>
 ))}
 </div>
 <div className="mt-8 pt-6 border-t border-sand-100 flex justify-end">
 <Button onClick={saveAlgorithm} className="bg-navy-950 text-white">Save Algorithm Configuration</Button>
 </div>
 </div>
 </div>
 <div className="space-y-6">
 <div className="bg-sand-50 rounded-2xl border border-sand-200 p-6">
 <h4 className="font-bold text-navy-950 mb-4 flex items-center gap-2">
 <Activity className="w-4 h-4 text-emerald-600" /> Ranking Analytics
 </h4>
 <div className="space-y-4">
 <div className="bg-white p-4 rounded-xl border border-sand-100 ">
 <p className="text-xs text-navy-950 font-bold uppercase tracking-widest mb-1">Top Searched Term</p>
 <p className="text-xl font-bold text-navy-950 ">"Luxury Pool Villa"</p>
 </div>
 <div className="bg-white p-4 rounded-xl border border-sand-100 ">
 <p className="text-xs text-navy-950 font-bold uppercase tracking-widest mb-1">Conversion Rate</p>
 <p className="text-xl font-bold text-emerald-600">8.4% <span className="text-xs text-emerald-600/50 ml-1">+1.2%</span></p>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'manual' && (
 <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
 <div className="p-6 border-b border-sand-100 bg-sand-50 flex justify-between items-center">
 <div>
 <h4 className="font-bold text-navy-950 ">Manual Search Priority</h4>
 <p className="text-xs text-navy-950 mt-1">Drag and drop to override algorithm ranking for top spots.</p>
 </div>
 <Button onClick={saveOrdering} className="bg-gold-500 text-white hover:bg-gold-600">Save Ordering</Button>
 </div>
 <div className="p-4 space-y-2">
 {manualPriorityList.map((resort, idx) => (
 <div key={resort.id} className="flex items-center gap-4 p-4 bg-white border border-sand-200 rounded-xl hover:border-gold-300 hover:shadow-md transition-all cursor-move group">
 <GripVertical className="w-5 h-5 text-sand-400 group-hover:text-gold-500" />
 <div className="w-8 h-8 rounded-full bg-navy-950 text-white flex items-center justify-center font-bold text-xs">
 #{idx + 1}
 </div>
 <div className="flex-1">
 <h5 className="font-bold text-navy-950 ">{resort.name}</h5>
 <p className="text-xs text-navy-950 ">{resort.type}</p>
 </div>
 <div className="flex items-center gap-6">
 <div className="text-right">
 <p className="text-[10px] font-bold text-navy-950 uppercase tracking-widest">Search Score</p>
 <p className="font-bold text-navy-950 font-mono">{resort.score}</p>
 </div>
 {resort.trend === 'up' ? (
 <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
 ) : (
 <ArrowDownCircle className="w-5 h-5 text-red-500" />
 )}
 </div>
 </div>
 ))}
 <div className="p-6 text-center border-2 border-dashed border-sand-200 rounded-xl text-navy-950 text-sm font-semibold">
 Algorithm continues ranking from spot #5...
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default SearchRankingModule;
