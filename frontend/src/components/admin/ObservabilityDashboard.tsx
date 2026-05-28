import React, { useEffect, useState } from 'react';
import { Activity, Server, AlertCircle, Clock, Zap, Database, TrendingUp, ShieldAlert } from 'lucide-react';

const MetricCard = ({ title, value, status, icon: Icon, trend }: any) => (
  <div className="bg-white  border border-[#C5A059]/20 p-6 rounded-2xl backdrop-blur-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${status === 'healthy' ? 'bg-green-500/10 text-green-400' : status === 'warning' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && <span className="text-xs font-medium text-[#C5A059] bg-[#C5A059]/10 px-2 py-1 rounded-full">{trend}</span>}
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-white mt-1">{value}</p>
  </div>
);

export const ObservabilityDashboard = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // In a real implementation, this would fetch from the Cloudflare/PostHog API wrappers
    // For now, we mock the visualization of our new infrastructure
    setMetrics({
      apiHealth: '99.9%',
      avgLatency: '142ms',
      activeTraceIds: 843,
      recentErrors: 12,
      bookingConversion: '14.2%',
      paymentSuccess: '98.5%',
    });
  }, []);

  if (!metrics) return <div className="text-white text-center py-20">Loading telemetry...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#0A1128] min-h-screen">
      <div className="flex justify-between items-end border-b border-[#C5A059]/20 pb-6">
        <div>
          <h1 className="text-3xl font-serif text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#C5A059]" />
            Platform Observability
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Real-time edge telemetry and business intelligence</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Systems Operational
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="API Edge Health" value={metrics.apiHealth} status="healthy" icon={Server} trend="Stable" />
        <MetricCard title="Avg Latency" value={metrics.avgLatency} status="healthy" icon={Clock} trend="-12ms" />
        <MetricCard title="Active Trace IDs" value={metrics.activeTraceIds} status="healthy" icon={Zap} />
        <MetricCard title="Unhandled Exceptions" value={metrics.recentErrors} status="warning" icon={AlertCircle} trend="+2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white  border border-[#C5A059]/20 p-8 rounded-3xl">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C5A059]" />
            Business Funnels (PostHog)
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Booking Conversion Rate</span>
                <span className="text-white font-medium">{metrics.bookingConversion}</span>
              </div>
              <div className="h-2 bg-white  rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#C5A059] to-yellow-300 w-[14.2%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">Payment Verification Success</span>
                <span className="text-white font-medium">{metrics.paymentSuccess}</span>
              </div>
              <div className="h-2 bg-white  rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-300 w-[98.5%]"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white  border border-red-500/20 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-red-500/5 rounded-full blur-3xl"></div>
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2 relative z-10">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Active Alerting Monitors
          </h3>
          <ul className="space-y-4 relative z-10">
            <li className="flex items-center justify-between text-sm p-4 bg-[#0A1128]/50 rounded-xl border border-white/5">
              <span className="text-slate-300">High Latency Detectors (&gt;2000ms)</span>
              <span className="text-green-400 text-xs font-medium px-2 py-1 bg-green-500/10 rounded-md">Active</span>
            </li>
            <li className="flex items-center justify-between text-sm p-4 bg-[#0A1128]/50 rounded-xl border border-white/5">
              <span className="text-slate-300">Payment Failure Spike (Razorpay)</span>
              <span className="text-green-400 text-xs font-medium px-2 py-1 bg-green-500/10 rounded-md">Active</span>
            </li>
            <li className="flex items-center justify-between text-sm p-4 bg-[#0A1128]/50 rounded-xl border border-white/5">
              <span className="text-slate-300">Prisma Disconnect / Edge DB Errors</span>
              <span className="text-green-400 text-xs font-medium px-2 py-1 bg-green-500/10 rounded-md">Active</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
