import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe, TrendingUp, Search, Target, AlertCircle,
  DollarSign, Star, BarChart2, Zap, ArrowUp, ArrowDown, Minus,
  IndianRupee, Shield, TrendingDown, MessageSquare, Calendar
} from "lucide-react";
import { apiClient } from "../../../utils/apiClient";
import { Button } from "../../../components/ui/Button";
import toast from "react-hot-toast";
import { cn } from "../../../utils/cn";

const TABS = [
  { id: "overview", label: "Distribution Report", icon: Globe },
  { id: "prices", label: "Price Tracker", icon: DollarSign },
  { id: "heatmap", label: "Demand Heatmap", icon: Calendar },
  { id: "sentiment", label: "Review Sentiment", icon: MessageSquare },
  { id: "leakage", label: "Revenue Leakage", icon: Shield },
];

const LEVEL_COLORS = ["bg-sand-100", "bg-green-200", "bg-yellow-300", "bg-orange-400", "bg-red-500"];
const LEVEL_LABELS = ["No Data", "Low", "Medium", "High", "Peak"];

export function OtaMarketAnalysis() {
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState<any[]>([]);
  const [prices, setPrices] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [leakage, setLeakage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ov, pr, hm, se, lk] = await Promise.allSettled([
        apiClient.get<any[]>("/admin/ota-analytics"),
        apiClient.get<any>("/admin/ota-analytics/price-tracker"),
        apiClient.get<any>("/admin/ota-analytics/demand-heatmap"),
        apiClient.get<any>("/admin/ota-analytics/sentiment"),
        apiClient.get<any>("/admin/ota-analytics/revenue-leakage"),
      ]);
      if (ov.status === "fulfilled") setOverview(ov.value || []);
      if (pr.status === "fulfilled") setPrices(pr.value);
      if (hm.status === "fulfilled") setHeatmap(hm.value);
      if (se.status === "fulfilled") setSentiment(se.value);
      if (lk.status === "fulfilled") setLeakage(lk.value);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await apiClient.post("/admin/ota-analytics/scan");
      toast.success("Market scan completed!");
      await fetchAll();
    } catch { toast.error("Scan failed"); }
    finally { setScanning(false); }
  };

  const totalReviews = overview.reduce((s, d) => s + (d.reviewVolume || 0), 0);
  const targets = overview.filter(d => d.opportunityScore >= 4).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-navy-950">OTA Market Intelligence</h2>
          <p className="text-navy-950/60 mt-1">Real-time competitive analysis across Booking.com, MakeMyTrip, Airbnb & more.</p>
        </div>
        <Button onClick={handleScan} isLoading={scanning} className="gap-2 rounded-xl">
          <Search className="w-4 h-4" /> Run Market Scan
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tracked Properties", value: overview.length, icon: Globe, color: "blue" },
          { label: "Acquisition Targets", value: targets, icon: Target, color: "green" },
          { label: "Total Market Reviews", value: totalReviews.toLocaleString(), icon: TrendingUp, color: "gold" },
          { label: "Avg OTA Commission", value: "18.4%", icon: Shield, color: "red" },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/50 mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-navy-950">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-sand-200 pb-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all",
              activeTab === t.id ? "border-gold-500 text-navy-950 bg-gold-50" : "border-transparent text-navy-950/50 hover:text-navy-950")}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* TAB: Overview */}
      {activeTab === "overview" && (
        <div className="bg-white border border-sand-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-sand-100 bg-sand-50/50">
            <h3 className="font-bold text-navy-950">Property Distribution Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-sand-50/30 text-[10px] uppercase tracking-wider text-navy-950/50">
                <tr>
                  <th className="p-4 font-bold">Resort</th>
                  <th className="p-4 font-bold">Channels</th>
                  <th className="p-4 font-bold text-center">Opportunity</th>
                  <th className="p-4 font-bold text-center">Rating / Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {overview.map(item => {
                  const channels = item.detectedChannels ? item.detectedChannels.split(",") : [];
                  const isHighOpp = item.opportunityScore >= 4;
                  return (
                    <tr key={item.id} className="hover:bg-sand-50/40 transition-colors">
                      <td className="p-4 font-medium text-navy-950">{item.resortName}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {channels.map(ch => (
                            <span key={ch} className="px-2 py-0.5 bg-navy-50 text-navy-700 text-[10px] font-bold rounded-lg border border-navy-100">{ch}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={cn("px-3 py-1 rounded-xl text-xs font-bold", isHighOpp ? "bg-green-100 text-green-700" : "bg-sand-100 text-navy-600")}>
                          {item.opportunityScore}/6 {isHighOpp ? "🎯" : ""}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-bold text-navy-950">{item.rating} <span className="text-gold-500">★</span></div>
                        <div className="text-[10px] text-navy-950/40">{(item.reviewVolume || 0).toLocaleString()} reviews</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Price Tracker */}
      {activeTab === "prices" && prices && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Avg Direct Savings", value: `₹${(prices.avgSavings || 0).toLocaleString()}`, sub: "vs OTA platforms", color: "text-green-600" },
              { label: "Avg Savings %", value: `${prices.avgSavingsPct || 17}%`, sub: "cheaper booking direct", color: "text-gold-600" },
              { label: "Properties on OTAs Not Listed Here", value: prices.properties?.filter((p: any) => p.notOnHampiStays).length || 0, sub: "potential acquisitions", color: "text-red-500" },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-navy-950/50 font-bold mb-1">{s.label}</p>
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-navy-950/40 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-sand-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-sand-100 bg-sand-50/50">
              <h3 className="font-bold text-navy-950">Nightly Rate Comparison (₹)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[10px] uppercase tracking-wider text-navy-950/40 bg-sand-50/30">
                  <tr>
                    <th className="p-4 font-bold">Resort</th>
                    <th className="p-4 font-bold text-center">HampiStays</th>
                    <th className="p-4 font-bold text-center">Booking.com</th>
                    <th className="p-4 font-bold text-center">MakeMyTrip</th>
                    <th className="p-4 font-bold text-center">Airbnb</th>
                    <th className="p-4 font-bold text-center">Agoda</th>
                    <th className="p-4 font-bold text-center">You Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {(prices.properties || []).map((p: any, i: number) => (
                    <tr key={i} className={cn("hover:bg-sand-50/40 transition-colors", p.notOnHampiStays && "bg-red-50/30")}>
                      <td className="p-4 font-medium text-navy-950">
                        {p.resort}
                        {p.notOnHampiStays && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Not Listed</span>}
                      </td>
                      <td className="p-4 text-center font-bold text-green-600">{p.hampistays ? `₹${p.hampistays.toLocaleString()}` : "—"}</td>
                      <td className="p-4 text-center text-navy-950/70">{p.bookingCom ? `₹${p.bookingCom.toLocaleString()}` : "—"}</td>
                      <td className="p-4 text-center text-navy-950/70">{p.makemytrip ? `₹${p.makemytrip.toLocaleString()}` : "—"}</td>
                      <td className="p-4 text-center text-navy-950/70">{p.airbnb ? `₹${p.airbnb.toLocaleString()}` : "—"}</td>
                      <td className="p-4 text-center text-navy-950/70">{p.agoda ? `₹${p.agoda.toLocaleString()}` : "—"}</td>
                      <td className="p-4 text-center">
                        {p.savings ? (
                          <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs">₹{p.savings.toLocaleString()}</span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Demand Heatmap */}
      {activeTab === "heatmap" && heatmap && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Peak Days (±30d)", value: heatmap.peakDays },
              { label: "Total Bookings", value: heatmap.totalBookings },
              { label: "Avg/Day", value: heatmap.avgBookingsPerDay },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-navy-950/50 font-bold mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-navy-950">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-sand-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-navy-950 mb-2">60-Day Demand Calendar</h3>
            <p className="text-xs text-navy-950/50 mb-5">Each cell = 1 day. Colour = booking density based on real reservation data.</p>
            <div className="flex gap-1 mb-3">
              {LEVEL_COLORS.map((c, i) => (
                <div key={i} className="flex items-center gap-1 mr-4">
                  <div className={cn("w-4 h-4 rounded", c)} />
                  <span className="text-[10px] text-navy-950/60">{LEVEL_LABELS[i]}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
              {(heatmap.heatmap || []).map((day: any, i: number) => (
                <div key={i} title={`${day.date}: ${day.bookings} bookings${day.event ? ` | ${day.event.name}` : ""}`}
                  className={cn("h-8 rounded cursor-pointer transition-all hover:scale-110 hover:z-10 relative flex items-center justify-center",
                    LEVEL_COLORS[day.level])}>
                  {day.event && <span className="text-[8px] font-black text-navy-900 leading-none text-center px-0.5 truncate">★</span>}
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              <p className="text-xs font-bold text-navy-950/60 uppercase tracking-wider mb-2">📅 Upcoming Events</p>
              {(heatmap.events || []).map((ev: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-sand-50 rounded-xl border border-sand-100">
                  <span className={cn("w-2.5 h-2.5 rounded-full", ev.impact === "very_high" ? "bg-red-500" : ev.impact === "high" ? "bg-orange-400" : "bg-yellow-400")} />
                  <span className="text-sm font-bold text-navy-950">{ev.name}</span>
                  <span className="text-xs text-navy-950/50 ml-auto">{ev.date}</span>
                  <span className="text-[10px] uppercase font-bold bg-navy-100 text-navy-700 px-2 py-0.5 rounded-full">{ev.impact.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Review Sentiment */}
      {activeTab === "sentiment" && sentiment && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cross-Platform Ratings */}
            <div className="bg-white border border-sand-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-navy-950 mb-5 flex items-center gap-2"><Star className="w-4 h-4 text-gold-500" />Cross-Platform Ratings</h3>
              <div className="space-y-3">
                {(sentiment.crossPlatform || []).map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-navy-950 w-28 shrink-0">{p.platform}</span>
                    <div className="flex-1 bg-sand-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-gold-500 transition-all" style={{ width: `${(p.rating / 5) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-navy-950 w-8 text-right">{p.rating}</span>
                    <span className="text-[10px] text-navy-950/40 w-20 text-right">{p.reviews.toLocaleString()} revs</span>
                    {p.trend === "up" ? <ArrowUp className="w-3 h-3 text-green-500" /> : p.trend === "down" ? <TrendingDown className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-navy-950/30" />}
                  </div>
                ))}
              </div>
            </div>
            {/* Opportunity Resorts */}
            <div className="bg-white border border-sand-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-navy-950 mb-5 flex items-center gap-2"><Target className="w-4 h-4 text-green-500" />Sentiment Opportunities</h3>
              <div className="space-y-4">
                {(sentiment.opportunities || []).map((op: any, i: number) => (
                  <div key={i} className="p-4 bg-green-50 border border-green-100 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-navy-950 text-sm">{op.resort}</span>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{op.otaRating} ★ OTA</span>
                    </div>
                    <p className="text-xs text-navy-950/60">{op.opportunity}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Praises */}
            <div className="bg-white border border-sand-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2">👍 Most Praised (Internal Reviews)</h3>
              {sentiment.topPraises?.length > 0 ? (
                <div className="space-y-2">
                  {sentiment.topPraises.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <span className="font-bold text-navy-950 text-sm capitalize">{p.keyword}</span>
                      <span className="text-xs text-green-600 font-bold">{p.count} mentions</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-navy-950/40">Not enough review data yet.</p>}
            </div>
            {/* Top Complaints */}
            <div className="bg-white border border-sand-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">⚠️ Top Complaints (Internal Reviews)</h3>
              {sentiment.topComplaints?.length > 0 ? (
                <div className="space-y-2">
                  {sentiment.topComplaints.map((c: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                      <div>
                        <span className="font-bold text-navy-950 text-sm capitalize">{c.keyword}</span>
                        <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{c.category}</span>
                      </div>
                      <span className="text-xs text-red-600 font-bold">{c.count} mentions</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-navy-950/40">Not enough review data yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Revenue Leakage */}
      {activeTab === "leakage" && leakage && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Direct Revenue (30d)", value: `₹${(leakage.directRevenue || 0).toLocaleString()}`, color: "text-green-600" },
              { label: "Saved vs OTAs", value: `₹${(leakage.totalSavedVsOta || 0).toLocaleString()}`, color: "text-gold-600" },
              { label: "Saved Per Booking", value: `₹${(leakage.perBookingSaved || 0).toLocaleString()}`, color: "text-blue-600" },
              { label: "Avg OTA Commission", value: `${leakage.avgOtaCommission}%`, color: "text-red-500" },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-sand-200 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-navy-950/50 font-bold mb-1">{s.label}</p>
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Platform */}
            <div className="bg-white border border-sand-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-navy-950 mb-5">Commission Rates by OTA</h3>
              <div className="space-y-4">
                {(leakage.leakageByPlatform || []).map((p: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-navy-950">{p.platform}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-red-500 font-bold">{p.rate}% commission</span>
                        <span className="text-green-600 font-bold">Saved ₹{(p.potentialLeakage || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-sand-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-red-400" style={{ width: `${(p.rate / 25) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* By Resort */}
            <div className="bg-white border border-sand-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-navy-950 mb-5">Per-Resort Direct Revenue</h3>
              {leakage.resortLeakage?.length > 0 ? (
                <div className="space-y-3">
                  {leakage.resortLeakage.map((r: any, i: number) => (
                    <div key={i} className="p-3 bg-sand-50 rounded-xl border border-sand-100">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-navy-950 truncate max-w-[60%]">{r.name}</span>
                        <span className="text-sm font-bold text-green-600">₹{r.directRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-navy-950/50">
                        <span>{r.bookings} bookings</span>
                        <span className="text-gold-600 font-bold">+₹{r.otaSaved.toLocaleString()} saved</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-navy-950/40">
                  <IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No completed bookings in the last 30 days yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-5 bg-navy-950 rounded-2xl text-white flex items-center gap-4">
            <Zap className="w-8 h-8 text-gold-400 shrink-0" />
            <div>
              <p className="font-bold text-white">💡 Key Insight</p>
              <p className="text-sm text-white/70 mt-0.5">
                Every booking made directly on HampiStays saves guests an average of <span className="text-gold-400 font-bold">₹{(leakage.perBookingSaved || 0).toLocaleString()}</span> vs OTA rates — and saves the platform <span className="text-gold-400 font-bold">{leakage.avgOtaCommission}%</span> in OTA commissions. Amplify this with the Refer & Earn programme to accelerate direct bookings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
