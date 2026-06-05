import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Globe, Bell, ShieldAlert, Sliders, Check, Loader2, ShieldCheck, Shield, User, Hotel, MapPin, TrendingUp } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Select } from '../../components/ui/Select';
import { useSystem } from '../../context/SystemContext';

export function AdminSettingsPage() {
 const { user, refreshUser } = useAuth();
 const { refreshSettings } = useSystem();
 
 const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
 
 // Toggles state
 const [settings, setSettings] = useState<any>(null);
 const [updatingToggle, setUpdatingToggle] = useState<string | null>(null);

 const [verificationSettings, setVerificationSettings] = useState<any>(null);
 const [updatingReq, setUpdatingReq] = useState<string | null>(null);

 const [guidePromoSettings, setGuidePromoSettings] = useState<any>(null);
 const [updatingPromo, setUpdatingPromo] = useState<string | null>(null);

 const [guideAnalytics, setGuideAnalytics] = useState<any>(null);

 useEffect(() => {
 fetchSettings();
 }, []);

 const fetchSettings = async () => {
 try {
 const data = await apiClient.get<any>('/admin/settings');
 setSettings(data);
 const vData = await apiClient.get<any>('/admin/verification-settings');
 setVerificationSettings(vData);
 const promoData = await apiClient.get<any>('/admin/guide-promotion-settings');
 setGuidePromoSettings(promoData);
 const analyticsData = await apiClient.get<any>('/admin/guide-promotion-analytics').catch(() => null);
 if (analyticsData) setGuideAnalytics(analyticsData);
 } catch (err) {
 toast.error('Failed to load global settings');
 }
 };

 const toggleRequirement = async (role: 'traveller' | 'resortOwner' | 'guide', req: string) => {
   if (!verificationSettings) return;
   setUpdatingReq(`${role}-${req}`);
   
   const roleKey = `${role}Requirements`;
   const currentList = verificationSettings[roleKey] || [];
   const isEnabled = currentList.includes(req);
   
   const newList = isEnabled 
     ? currentList.filter((item: string) => item !== req)
     : [...currentList, req];
       
   try {
     const data = await apiClient.post<any>('/admin/verification-settings', {
       [roleKey]: newList
     });
     setVerificationSettings(data);
     await refreshSettings();
     toast.success('Verification requirement updated');
   } catch (err: any) {
     toast.error(err.message || 'Failed to update requirement');
   } finally {
     setUpdatingReq(null);
   }
 };

  const togglePromoSetting = async (key: string, value: any) => {
    if (!guidePromoSettings) return;
    setUpdatingPromo(key);
    try {
      const data = await apiClient.post<any>('/admin/guide-promotion-settings', { [key]: value });
      setGuidePromoSettings(data);
      toast.success('Promotion setting updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update setting');
    } finally {
      setUpdatingPromo(null);
    }
  };

 const updatePreference = async (key: string, value: string) => {
 try {
 if (key === 'language') setIsUpdatingLanguage(true);
 
 await apiClient.post('/admin/profile/update', { [key]: value });
 toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} updated`);
 refreshUser();
 } catch (err: any) {
 toast.error(err.message || `Failed to update ${key}`);
 } finally {
 setIsUpdatingLanguage(false);
 }
 };

 const toggleSetting = async (key: string) => {
 if (!settings) return;
 setUpdatingToggle(key);
 const newValue = !settings[key];
 try {
 const data = await apiClient.post<any>('/admin/settings', { [key]: newValue });
 setSettings(data);
 toast.success('Setting updated');
 } catch (err: any) {
 toast.error(err.message || 'Failed to update setting');
 } finally {
 setUpdatingToggle(null);
 }
 };

 return (
 <div className="min-h-screen bg-sand-50 pt-32 pb-20 transition-colors">
 <div className="container mx-auto px-4 md:px-8 max-w-4xl">
 
 <div className="mb-12">
 <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">Platform Settings</h1>
 <p className="text-navy-950 font-medium">Configure global preferences and operational toggles.</p>
 </div>

 <div className="space-y-6">
 
 {/* Global Preferences */}
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 transition-colors"
 >
 <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
 <Sliders className="w-5 h-5 mr-3 text-gold-500" />
 Global Preferences
 </h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-3 relative">
 <label className="text-sm font-bold text-navy-950 flex items-center">
 <Globe className="w-4 h-4 mr-2 text-navy-950 " />
 Primary Language
 </label>
 <Select 
 disabled={isUpdatingLanguage}
 value={(user as any)?.language || 'en-US'}
 onChange={(val) => updatePreference('language', val)}
 options={[
 { value: "en-US", label: "English (US)" },
 { value: "en-UK", label: "English (UK)" },
 { value: "hi-IN", label: "Hindi" },
 { value: "kn-IN", label: "Kannada" }
 ]}
 />
 {isUpdatingLanguage && <Loader2 className="w-4 h-4 animate-spin text-navy-950 absolute top-10 right-3" />}
 </div>
 
 
 </div>
 </motion.div>

 {/* Notification Controls */}
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 transition-colors"
 >
 <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
 <Bell className="w-5 h-5 mr-3 text-gold-500" />
 Notification Controls
 </h3>
 
 <div className="space-y-4">
 {[
 { key: 'notifyNewUsers', title: 'New User Registrations', desc: 'Receive alerts when new owners or guides register.' },
 { key: 'notifyHighValueBookings', title: 'High-Value Bookings', desc: 'Alerts for bookings exceeding $1000.' },
 { key: 'notifySystemAlerts', title: 'System Alerts', desc: 'Critical system performance and security alerts.' },
 ].map((item, i) => {
 const isActive = settings?.[item.key] ?? false;
 const isUpdating = updatingToggle === item.key;
 return (
 <div key={i} className="flex items-center justify-between p-4 border border-sand-100 rounded-xl hover:bg-sand-50 :bg-sand-100/50 transition-colors">
 <div>
 <h4 className="font-bold text-navy-950 text-sm">{item.title}</h4>
 <p className="text-xs text-navy-950 mt-0.5">{item.desc}</p>
 </div>
 <button 
 disabled={!settings || isUpdating}
 onClick={() => toggleSetting(item.key)}
 className={`w-12 h-6 rounded-full transition-colors relative flex items-center disabled:opacity-50 ${isActive ? 'bg-gold-500' : 'bg-sand-200 '}`}
 >
 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'left-7' : 'left-1'}`} />
 {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-navy-950 absolute -left-6" />}
 </button>
 </div>
 );
 })}
 </div>
 </motion.div>

 {/* Verification Requirements Center */}
 <motion.div 
   initial={{ opacity: 0, y: 20 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ delay: 0.15 }}
   className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 transition-colors mb-6"
 >
   <div className="mb-6">
     <h3 className="text-xl font-bold text-navy-950 flex items-center">
       <ShieldCheck className="w-5 h-5 mr-3 text-gold-500" />
       Verification Requirements
     </h3>
     <p className="text-sm text-navy-950 mt-1">Dynamically control which documents are required for onboarding.</p>
   </div>
   
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
     {/* Travellers */}
     <div className="bg-sand-50 rounded-2xl p-5 border border-sand-200">
       <h4 className="font-bold text-navy-950 flex items-center mb-4 pb-3 border-b border-sand-200">
         <User className="w-4 h-4 mr-2" /> Travellers
       </h4>
       <div className="space-y-3">
         {[


           { id: 'GOVERNMENT_ID', label: 'Government ID' },
           { id: 'AADHAAR', label: 'Aadhaar' },
           { id: 'PASSPORT', label: 'Passport' }
         ].map(req => {
           const isActive = verificationSettings?.travellerRequirements?.includes(req.id);
           const isUpdating = updatingReq === `traveller-${req.id}`;
           return (
             <div key={req.id} className="flex items-center justify-between">
               <span className="text-xs font-semibold text-navy-950">{req.label}</span>
               <button 
                 disabled={!verificationSettings || isUpdating}
                 onClick={() => toggleRequirement('traveller', req.id)}
                 className={`w-9 h-5 rounded-full transition-colors relative flex items-center disabled:opacity-50 ${isActive ? 'bg-gold-500' : 'bg-sand-200'}`}
               >
                 <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'left-4' : 'left-0.5'}`} />
                 {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-navy-950 absolute -left-5" />}
               </button>
             </div>
           )
         })}
       </div>
     </div>

     {/* Resort Owners */}
     <div className="bg-sand-50 rounded-2xl p-5 border border-sand-200">
       <h4 className="font-bold text-navy-950 flex items-center mb-4 pb-3 border-b border-sand-200">
         <Hotel className="w-4 h-4 mr-2" /> Resort Owners
       </h4>
       <div className="space-y-3">
         {[
           { id: 'AADHAAR', label: 'Aadhaar' },
           { id: 'PAN', label: 'PAN' },
           { id: 'PROPERTY_OWNERSHIP_PROOF', label: 'Property Ownership Proof' },
           { id: 'BANK_VERIFICATION', label: 'Bank Verification' },
           { id: 'GST_CERTIFICATE', label: 'GST Certificate' },
           { id: 'TRADE_LICENSE', label: 'Trade License' },
           { id: 'TOURISM_REGISTRATION', label: 'Tourism Registration' },
           { id: 'FSSAI_LICENSE', label: 'FSSAI License' }
         ].map(req => {
           const isActive = verificationSettings?.resortOwnerRequirements?.includes(req.id);
           const isUpdating = updatingReq === `resortOwner-${req.id}`;
           return (
             <div key={req.id} className="flex items-center justify-between">
               <span className="text-xs font-semibold text-navy-950">{req.label}</span>
               <button 
                 disabled={!verificationSettings || isUpdating}
                 onClick={() => toggleRequirement('resortOwner', req.id)}
                 className={`w-9 h-5 rounded-full transition-colors relative flex items-center disabled:opacity-50 ${isActive ? 'bg-gold-500' : 'bg-sand-200'}`}
               >
                 <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'left-4' : 'left-0.5'}`} />
                 {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-navy-950 absolute -left-5" />}
               </button>
             </div>
           )
         })}
       </div>
     </div>

     {/* Local Guides */}
     <div className="bg-sand-50 rounded-2xl p-5 border border-sand-200">
       <h4 className="font-bold text-navy-950 flex items-center mb-4 pb-3 border-b border-sand-200">
         <MapPin className="w-4 h-4 mr-2" /> Local Guides
       </h4>
       <div className="space-y-3">
         {[
           { id: 'AADHAAR', label: 'Aadhaar' },
           { id: 'GUIDE_LICENSE', label: 'Guide License' },
           { id: 'PAN', label: 'PAN' },
           { id: 'BANK_VERIFICATION', label: 'Bank Verification' }
         ].map(req => {
           const isActive = verificationSettings?.guideRequirements?.includes(req.id);
           const isUpdating = updatingReq === `guide-${req.id}`;
           return (
             <div key={req.id} className="flex items-center justify-between">
               <span className="text-xs font-semibold text-navy-950">{req.label}</span>
               <button 
                 disabled={!verificationSettings || isUpdating}
                 onClick={() => toggleRequirement('guide', req.id)}
                 className={`w-9 h-5 rounded-full transition-colors relative flex items-center disabled:opacity-50 ${isActive ? 'bg-gold-500' : 'bg-sand-200'}`}
               >
                 <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'left-4' : 'left-0.5'}`} />
                 {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-navy-950 absolute -left-5" />}
               </button>
             </div>
           )
         })}
       </div>
     </div>
   </div>
 </motion.div>

  {/* Smart Guide Promotions Settings */}
  <motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.18 }}
  className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 transition-colors mb-6"
  >
  <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
  <MapPin className="w-5 h-5 mr-3 text-gold-500" />
  Smart Guide Promotions Engine
  </h3>
  
  <div className="space-y-4">
  {[
  { key: 'enableRecommendations', title: 'Enable Guide Recommendations', desc: 'Global toggle for the Smart Guide Discovery system.' },
  { key: 'enableDashboardBanner', title: 'Dashboard Banner', desc: 'Show contextual banner on traveler dashboard.' },
  { key: 'enableSuccessUpsell', title: 'Booking Success Upsell', desc: 'Prompt travelers to book a guide after resort confirmation.' },
  { key: 'enableBundleOffers', title: 'Stay + Guide Bundles', desc: 'Offer discounts when booked together.' },
  ].map((item, i) => {
  const isActive = guidePromoSettings?.[item.key] ?? false;
  const isUpdating = updatingPromo === item.key;
  return (
  <div key={i} className="flex items-center justify-between p-4 border border-sand-100 rounded-xl hover:bg-sand-50 transition-colors">
  <div>
  <h4 className="font-bold text-navy-950 text-sm">{item.title}</h4>
  <p className="text-xs text-navy-950 mt-0.5">{item.desc}</p>
  </div>
  <button 
  disabled={!guidePromoSettings || isUpdating}
  onClick={() => togglePromoSetting(item.key, !isActive)}
  className={`w-12 h-6 rounded-full transition-colors relative flex items-center disabled:opacity-50 ${isActive ? 'bg-gold-500' : 'bg-sand-200 '}`}
  >
  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'left-7' : 'left-1'}`} />
  {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-navy-950 absolute -left-6" />}
  </button>
  </div>
  );
  })}

  {guidePromoSettings?.enableBundleOffers && (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-sand-100 rounded-xl bg-sand-50 transition-colors">
      <div className="mb-4 sm:mb-0">
        <h4 className="font-bold text-navy-950 text-sm">Bundle Discount Amount (₹)</h4>
        <p className="text-xs text-navy-950 mt-0.5">Discount applied when booking stay + guide.</p>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="number"
          value={guidePromoSettings.bundleDiscountAmount}
          onChange={(e) => setGuidePromoSettings({...guidePromoSettings, bundleDiscountAmount: Number(e.target.value)})}
          className="w-24 px-3 py-1.5 border border-sand-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
        />
        <button 
          disabled={updatingPromo === 'bundleDiscountAmount'}
          onClick={() => togglePromoSetting('bundleDiscountAmount', guidePromoSettings.bundleDiscountAmount)}
          className="px-3 py-1.5 bg-navy-950 text-white rounded-lg text-xs font-bold"
        >
          {updatingPromo === 'bundleDiscountAmount' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
        </button>
      </div>
    </div>
  )}

  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-sand-100 rounded-xl transition-colors">
    <div className="mb-4 sm:mb-0">
      <h4 className="font-bold text-navy-950 text-sm">Banner Text</h4>
    </div>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <input 
        type="text"
        value={guidePromoSettings?.bannerText || ''}
        onChange={(e) => setGuidePromoSettings({...guidePromoSettings, bannerText: e.target.value})}
        className="w-full sm:w-64 px-3 py-1.5 border border-sand-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
      />
      <button 
        disabled={updatingPromo === 'bannerText'}
        onClick={() => togglePromoSetting('bannerText', guidePromoSettings.bannerText)}
        className="px-3 py-1.5 bg-navy-950 text-white rounded-lg text-xs font-bold"
      >
        Save
      </button>
    </div>
  </div>
  </div>
  </motion.div>

  {/* Guide Promotions Analytics Dashboard */}
  <motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.19 }}
  className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 transition-colors mb-6"
  >
    <div className="mb-6 flex items-center justify-between">
      <h3 className="text-xl font-bold text-navy-950 flex items-center">
        <TrendingUp className="w-5 h-5 mr-3 text-gold-500" />
        Promotions Engine Performance
      </h3>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200">
        <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-1">Impressions</p>
        <p className="text-2xl font-bold text-navy-950">{guideAnalytics?.impressions?.toLocaleString() || 0}</p>
      </div>
      <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200">
        <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-1">Clicks</p>
        <p className="text-2xl font-bold text-navy-950">{guideAnalytics?.clicks?.toLocaleString() || 0}</p>
      </div>
      <div className="bg-sand-50 rounded-2xl p-4 border border-sand-200">
        <p className="text-[10px] font-bold text-navy-950/40 uppercase tracking-widest mb-1">Guide Bookings</p>
        <p className="text-2xl font-bold text-navy-950">{guideAnalytics?.guideBookings?.toLocaleString() || 0}</p>
      </div>
      <div className="bg-gold-50 rounded-2xl p-4 border border-gold-200">
        <p className="text-[10px] font-bold text-gold-800 uppercase tracking-widest mb-1">Revenue Gen</p>
        <p className="text-2xl font-bold text-gold-700">₹{guideAnalytics?.revenueGenerated?.toLocaleString() || 0}</p>
      </div>
    </div>
  </motion.div>

  {/* Authentication & Security */}
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.195 }}
    className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 transition-colors mb-6"
  >
    <div className="mb-6">
      <h3 className="text-xl font-bold text-navy-950 flex items-center">
        <Shield className="w-5 h-5 mr-3 text-gold-500" />
        Authentication & Security
      </h3>
      <p className="text-sm text-navy-950 mt-1">Manage mandatory authentication verifications.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        { id: 'MOBILE_OTP', label: 'Mobile OTP Verification', desc: 'Require users to verify their phone numbers.' },
        { id: 'EMAIL_VERIFICATION', label: 'Email Verification', desc: 'Require users to verify their email addresses.' }
      ].map(req => {
        const isActive = verificationSettings?.travellerRequirements?.includes(req.id);
        const isUpdating = updatingReq === `traveller-${req.id}`;
        return (
          <div key={req.id} className="bg-sand-50 rounded-2xl p-5 border border-sand-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-navy-950 text-sm">{req.label}</h4>
              <p className="text-xs text-navy-950 mt-0.5">{req.desc}</p>
            </div>
            <button 
              disabled={!verificationSettings || isUpdating}
              onClick={() => toggleRequirement('traveller', req.id)}
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center disabled:opacity-50 ${isActive ? 'bg-gold-500' : 'bg-sand-200'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'left-4' : 'left-0.5'}`} />
              {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-navy-950 absolute -left-5" />}
            </button>
          </div>
        );
      })}
    </div>
  </motion.div>

 {/* Operational & Audit */}
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 border-l-4 border-l-red-500 transition-colors"
 >
 <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
 <ShieldAlert className="w-5 h-5 mr-3 text-red-500" />
 Operational & Audit Toggles
 </h3>
 
 <div className="space-y-4">
 <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border transition-colors ${
 settings?.maintenanceMode ? 'bg-red-50/80 border-red-200 ' : 'bg-sand-50 border-sand-200 '
 }`}>
 <div className="mb-4 sm:mb-0">
 <h4 className={`font-bold mb-1 ${settings?.maintenanceMode ? 'text-red-900 ' : 'text-navy-950 '}`}>Maintenance Mode</h4>
 <p className={`text-xs ${settings?.maintenanceMode ? 'text-red-800/70 ' : 'text-navy-950 '}`}>Temporarily disable public access to the platform.</p>
 </div>
 <button 
 disabled={!settings || updatingToggle === 'maintenanceMode'}
 onClick={() => toggleSetting('maintenanceMode')}
 className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors flex items-center disabled:opacity-50 ${
 settings?.maintenanceMode 
 ? 'bg-red-600 text-white hover:bg-red-700' 
 : 'bg-red-100 text-red-700 hover:bg-red-200 :bg-red-900/50'
 }`}
 >
 {updatingToggle === 'maintenanceMode' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
 {settings?.maintenanceMode ? 'Disable' : 'Enable'}
 </button>
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-sand-50 rounded-xl border border-sand-200 transition-colors">
 <div className="mb-4 sm:mb-0">
 <h4 className="font-bold text-navy-950 mb-1">Detailed Audit Logging</h4>
 <p className="text-xs text-navy-950 ">Log all read/write operations for compliance.</p>
 </div>
 <button 
 disabled={!settings || updatingToggle === 'detailedAuditLogging'}
 onClick={() => toggleSetting('detailedAuditLogging')}
 className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 ${
 settings?.detailedAuditLogging 
 ? 'bg-navy-950 text-white hover:bg-navy-800 :bg-sand-100 ' 
 : 'bg-sand-200 text-navy-950 hover:bg-sand-300 :bg-sand-200'
 }`}
 >
 {updatingToggle === 'detailedAuditLogging' ? (
 <Loader2 className="w-4 h-4 animate-spin mr-2" />
 ) : settings?.detailedAuditLogging ? (
 <Check className="w-4 h-4 mr-2 text-gold-500" />
 ) : null}
 {settings?.detailedAuditLogging ? 'Active' : 'Inactive'}
 </button>
 </div>
 </div>
 </motion.div>

 </div>
 </div>
 </div>
 );
}
