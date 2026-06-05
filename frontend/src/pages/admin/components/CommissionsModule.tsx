import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, FileText, CheckCircle2, Clock, Calculator, ArrowRight, Zap, History } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import toast from 'react-hot-toast';

export function CommissionsModule() {
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [disbursing, setDisbursing] = useState<string | null>(null);

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>('/admin/payouts/ledgers');
      setLedgers(data || []);
    } catch (err) {
      toast.error('Failed to load settlement ledgers');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayouts = async () => {
    setGenerating(true);
    try {
      const res = await apiClient.post<{ success: boolean, processed: number, message: string }>('/admin/payouts/generate');
      if (res.processed > 0) {
        toast.success(`Success! Generated ledgers for ${res.processed} bookings.`);
        fetchLedgers();
      } else {
        toast('No pending bookings ready for settlement.', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error('Failed to generate payouts');
    } finally {
      setGenerating(false);
    }
  };

  const handleDisburse = async (id: string) => {
    if (!window.confirm("Are you sure you want to release funds to this owner? This action cannot be undone.")) return;
    setDisbursing(id);
    try {
      await apiClient.post(`/admin/payouts/disburse/${id}`);
      toast.success('Funds successfully disbursed!');
      fetchLedgers();
    } catch (err) {
      toast.error('Disbursement failed');
    } finally {
      setDisbursing(null);
    }
  };

  const pendingAmount = ledgers.filter(l => l.status === 'PENDING').reduce((sum, l) => sum + l.totalNet, 0);
  const platformRevenue = ledgers.reduce((sum, l) => sum + l.totalCommission, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-sand-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Calculator className="w-64 h-64 text-gold-500 transform rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-3xl font-bold text-navy-950 tracking-tight">Financial Engine</h3>
            <p className="text-navy-700 mt-2 max-w-xl">
              Automated ledger generation and bulk payouts. Calculate platform commissions and disburse owner settlements with one click.
            </p>
          </div>
          <button
            onClick={handleGeneratePayouts}
            disabled={generating}
            className="px-6 py-3.5 bg-navy-950 text-white rounded-xl font-semibold hover:bg-navy-900 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70"
          >
            {generating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Zap className="w-5 h-5 text-gold-400" />
            )}
            Run Settlement Engine
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          <div className="bg-sand-50 rounded-2xl p-6 border border-sand-200">
            <p className="text-sm font-bold text-navy-400 tracking-widest uppercase">Pending Owner Payouts</p>
            <p className="text-4xl font-bold text-navy-950 mt-2">₹{pendingAmount.toLocaleString()}</p>
          </div>
          <div className="bg-gold-50 rounded-2xl p-6 border border-gold-200">
            <p className="text-sm font-bold text-gold-700 tracking-widest uppercase">Total Platform Rev.</p>
            <p className="text-4xl font-bold text-gold-900 mt-2">₹{platformRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
            <p className="text-sm font-bold text-green-700 tracking-widest uppercase">Ledgers Generated</p>
            <p className="text-4xl font-bold text-green-900 mt-2">{ledgers.length}</p>
          </div>
        </div>
      </div>

      {/* Ledgers List */}
      <div className="bg-white rounded-[2.5rem] border border-sand-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-sand-200 bg-sand-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <History className="w-5 h-5 text-navy-950" />
            </div>
            <h4 className="text-xl font-bold text-navy-950">Settlement Ledgers</h4>
          </div>
        </div>

        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ledgers.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <FileText className="w-16 h-16 text-sand-300 mb-4" />
            <h5 className="text-xl font-bold text-navy-950 mb-2">No Ledgers Found</h5>
            <p className="text-navy-600 max-w-sm">Click "Run Settlement Engine" to scan for completed bookings and generate payouts.</p>
          </div>
        ) : (
          <div className="divide-y divide-sand-200">
            {ledgers.map((ledger) => (
              <div key={ledger.id} className="p-8 hover:bg-sand-50/30 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                        ledger.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {ledger.status}
                      </span>
                      <span className="text-sm font-mono text-navy-400">ID: {ledger.id}</span>
                    </div>
                    <h5 className="text-lg font-bold text-navy-950">
                      {ledger.owner?.user?.name || 'Unknown Owner'} 
                      <span className="text-navy-500 text-sm font-normal ml-2">({ledger.owner?.user?.email})</span>
                    </h5>
                    <p className="text-sm text-navy-600 mt-2">
                      Generated: {new Date(ledger.createdAt).toLocaleDateString()} • Includes {ledger.payouts?.length || 0} bookings
                    </p>
                  </div>

                  <div className="flex gap-8 items-center bg-sand-50 rounded-2xl p-6 border border-sand-200">
                    <div>
                      <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-1">Gross Booking</p>
                      <p className="font-semibold text-navy-950">₹{ledger.totalGross.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-10 bg-sand-200" />
                    <div>
                      <p className="text-xs font-bold text-gold-600 uppercase tracking-widest mb-1">-7% Platform</p>
                      <p className="font-semibold text-gold-700">-₹{ledger.totalCommission.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-10 bg-sand-200" />
                    <div>
                      <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">Owner Payout</p>
                      <p className="text-2xl font-bold text-green-700">₹{ledger.totalNet.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {ledger.status === 'PAID' ? (
                      <div className="flex items-center gap-2 text-green-700 font-semibold bg-green-50 px-6 py-4 rounded-xl border border-green-100">
                        <CheckCircle2 className="w-5 h-5" />
                        Disbursed
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDisburse(ledger.id)}
                        disabled={disbursing === ledger.id}
                        className="px-6 py-4 bg-navy-950 text-white rounded-xl font-semibold hover:bg-navy-900 transition-all flex items-center gap-2 w-full justify-center disabled:opacity-70"
                      >
                        {disbursing === ledger.id ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>Disburse Funds <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
