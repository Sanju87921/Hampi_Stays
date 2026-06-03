import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Globe, TrendingUp, Search, ExternalLink, Target, AlertCircle } from "lucide-react";
import { apiClient } from "../../../utils/apiClient";
import { Button } from "../../../components/ui/Button";

interface OtaData {
  id: string;
  resortName: string;
  bookingComUrl: string | null;
  airbnbUrl: string | null;
  goibiboUrl: string | null;
  makemytripUrl: string | null;
  agodaUrl: string | null;
  expediaUrl: string | null;
  detectedChannels: string | null;
  reviewVolume: number;
  rating: number | null;
  opportunityScore: number;
}

export function OtaMarketAnalysis() {
  const [data, setData] = useState<OtaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOtaData = async () => {
      try {
        const response = await apiClient.get<OtaData[]>("/admin/ota-analytics");
        setData(response);
      } catch (err) {
        console.error("Failed to fetch OTA analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOtaData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sortedByOpportunity = [...data].sort((a, b) => b.opportunityScore - a.opportunityScore);
  const acquisitionTargets = sortedByOpportunity.slice(0, 3);
  
  const mostVisible = [...data].sort((a, b) => b.reviewVolume - a.reviewVolume).slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-navy-950">OTA Market Analysis</h2>
          <p className="text-navy-950/60 mt-2 max-w-2xl">
            Real-time tracking of Hampi resort distributions across major OTAs. Use opportunity scores to target high-value acquisitions.
          </p>
        </div>
        <Button className="bg-navy-950 text-white rounded-xl gap-2">
          <Search className="w-4 h-4" /> Run Market Scan
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white border border-sand-200 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-navy-950/50">Tracked Properties</p>
              <h3 className="text-2xl font-bold text-navy-950">{data.length}</h3>
            </div>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 bg-white border border-sand-200 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-navy-950/50">Acquisition Targets</p>
              <h3 className="text-2xl font-bold text-navy-950">{data.filter(d => d.opportunityScore >= 4).length}</h3>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 bg-white border border-sand-200 rounded-3xl shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gold-50 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gold-600" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-navy-950/50">Total Market Reviews</p>
              <h3 className="text-2xl font-bold text-navy-950">{data.reduce((acc, curr) => acc + curr.reviewVolume, 0).toLocaleString()}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-sand-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-sand-100 flex justify-between items-center bg-sand-50/50">
              <h3 className="text-lg font-bold text-navy-950">Property Distribution Report</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-sand-50/30 text-xs uppercase tracking-wider text-navy-950/50">
                  <tr>
                    <th className="p-4 font-bold">Resort Name</th>
                    <th className="p-4 font-bold">Channels</th>
                    <th className="p-4 font-bold text-center">Score</th>
                    <th className="p-4 font-bold text-center">Rating / Vol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {data.map((item) => {
                    const channels = item.detectedChannels ? item.detectedChannels.split(",") : [];
                    return (
                      <tr key={item.id} className="hover:bg-sand-50/50 transition-colors">
                        <td className="p-4 font-medium text-navy-950">{item.resortName}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {channels.map(ch => (
                              <span key={ch} className="px-2 py-1 bg-navy-50 text-navy-950 text-[10px] font-bold rounded-lg border border-navy-100">
                                {ch}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                            item.opportunityScore >= 4 ? 'bg-green-100 text-green-700' : 'bg-sand-100 text-navy-700'
                          }`}>
                            {item.opportunityScore}/6
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="text-sm font-bold text-navy-950">{item.rating} <span className="text-gold-500">★</span></div>
                          <div className="text-[10px] text-navy-950/50 uppercase tracking-widest">{item.reviewVolume} revs</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-sand-200 rounded-3xl shadow-sm p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy-950 mb-6 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" /> Top Acquisition Targets
            </h3>
            <div className="space-y-4">
              {acquisitionTargets.map((target, idx) => (
                <div key={target.id} className="flex items-center gap-4 p-4 bg-sand-50 rounded-2xl border border-sand-100">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy-950 text-sm">{target.resortName}</h4>
                    <p className="text-xs text-navy-950/60 mt-1 flex items-center gap-1">
                      Score: <span className="font-bold text-navy-950">{target.opportunityScore}/6</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-sand-200 rounded-3xl shadow-sm p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy-950 mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gold-600" /> Most Visible Competitors
            </h3>
            <div className="space-y-4">
              {mostVisible.map((resort, idx) => (
                <div key={resort.id} className="flex items-center justify-between p-3 border-b border-sand-100 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-medium text-navy-950 text-sm">{resort.resortName}</span>
                    <span className="text-xs text-navy-950/50">{resort.rating} ★ Rating</span>
                  </div>
                  <span className="text-xs font-bold bg-navy-50 text-navy-700 px-2 py-1 rounded-lg">
                    {resort.reviewVolume} reviews
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
