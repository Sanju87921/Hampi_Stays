import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Globe, Moon, Bell, ShieldAlert, Sliders, Check, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export function AdminSettingsPage() {
  const { user, refreshUser } = useAuth();
  
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  
  // Toggles state
  const [settings, setSettings] = useState<any>(null);
  const [updatingToggle, setUpdatingToggle] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Create a specific endpoint if needed, or we just map it.
      // Since we just have the POST/PATCH `/admin/settings` which also acts as an init.
      // We can do a dummy update to fetch or we can create a GET if we added one. 
      // The worker route `on(['POST', 'PATCH'], '/admin/settings')` implies we can fetch or just hit POST.
      // I'll assume we can use the `app.get('/admin/stats')` or we need a GET for settings.
      // Since we might not have a clean GET /admin/settings in the backend, I'll just post an empty object.
      const data = await apiClient.post<any>('/admin/settings', {});
      setSettings(data);
    } catch (err) {
      toast.error('Failed to load global settings');
    }
  };

  const updatePreference = async (key: string, value: string) => {
    try {
      if (key === 'language') setIsUpdatingLanguage(true);
      if (key === 'theme') setIsUpdatingTheme(true);
      
      await apiClient.post('/admin/profile/update', { [key]: value });
      toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} updated`);
      refreshUser();
    } catch (err: any) {
      toast.error(err.message || `Failed to update ${key}`);
    } finally {
      setIsUpdatingLanguage(false);
      setIsUpdatingTheme(false);
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
    <div className="min-h-screen bg-sand-50 pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-navy-950 mb-2">Platform Settings</h1>
          <p className="text-navy-950/60 font-medium">Configure global preferences and operational toggles.</p>
        </div>

        <div className="space-y-6">
          
          {/* Global Preferences */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200"
          >
            <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
              <Sliders className="w-5 h-5 mr-3 text-gold-500" />
              Global Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 relative">
                <label className="text-sm font-bold text-navy-950 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-navy-950/50" />
                  Primary Language
                </label>
                <select 
                  disabled={isUpdatingLanguage}
                  value={(user as any)?.language || 'en-US'}
                  onChange={(e) => updatePreference('language', e.target.value)}
                  className="w-full p-3 bg-sand-50 border border-sand-200 rounded-xl text-navy-950 font-medium focus:outline-none focus:border-gold-400 disabled:opacity-50"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-UK">English (UK)</option>
                  <option value="hi-IN">Hindi</option>
                  <option value="kn-IN">Kannada</option>
                </select>
                {isUpdatingLanguage && <Loader2 className="w-4 h-4 animate-spin text-navy-950 absolute top-10 right-3" />}
              </div>
              
              <div className="space-y-3 relative">
                <label className="text-sm font-bold text-navy-950 flex items-center">
                  <Moon className="w-4 h-4 mr-2 text-navy-950/50" />
                  Dashboard Theme
                </label>
                <div className={`flex bg-sand-50 p-1 rounded-xl border border-sand-200 ${isUpdatingTheme ? 'opacity-50 pointer-events-none' : ''}`}>
                  {['light', 'dark', 'system'].map((t) => (
                    <button 
                      key={t}
                      onClick={() => updatePreference('theme', t)}
                      className={`flex-1 py-2 text-sm font-bold capitalize transition-colors rounded-lg ${
                        (user as any)?.theme === t || (!user?.theme && t === 'light') 
                          ? 'bg-white text-navy-950 shadow-sm' 
                          : 'text-navy-950/50 hover:text-navy-950'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {isUpdatingTheme && <Loader2 className="w-4 h-4 animate-spin text-navy-950 absolute top-10 -right-2" />}
              </div>
            </div>
          </motion.div>

          {/* Notification Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200"
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
                  <div key={i} className="flex items-center justify-between p-4 border border-sand-100 rounded-xl hover:bg-sand-50 transition-colors">
                    <div>
                      <h4 className="font-bold text-navy-950 text-sm">{item.title}</h4>
                      <p className="text-xs text-navy-950/60 mt-0.5">{item.desc}</p>
                    </div>
                    <button 
                      disabled={!settings || isUpdating}
                      onClick={() => toggleSetting(item.key)}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center disabled:opacity-50 ${isActive ? 'bg-gold-500' : 'bg-sand-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'left-7' : 'left-1'}`} />
                      {isUpdating && <Loader2 className="w-4 h-4 animate-spin text-navy-950 absolute -left-6" />}
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
            className="bg-white rounded-3xl p-8 shadow-sm border border-sand-200 border-l-4 border-l-red-500"
          >
            <h3 className="text-xl font-bold text-navy-950 mb-6 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-3 text-red-500" />
              Operational & Audit Toggles
            </h3>
            
            <div className="space-y-4">
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl border transition-colors ${
                settings?.maintenanceMode ? 'bg-red-50/80 border-red-200' : 'bg-sand-50 border-sand-200'
              }`}>
                <div className="mb-4 sm:mb-0">
                  <h4 className={`font-bold mb-1 ${settings?.maintenanceMode ? 'text-red-900' : 'text-navy-950'}`}>Maintenance Mode</h4>
                  <p className={`text-xs ${settings?.maintenanceMode ? 'text-red-800/70' : 'text-navy-950/60'}`}>Temporarily disable public access to the platform.</p>
                </div>
                <button 
                  disabled={!settings || updatingToggle === 'maintenanceMode'}
                  onClick={() => toggleSetting('maintenanceMode')}
                  className={`px-5 py-2 text-sm font-bold rounded-lg transition-colors flex items-center disabled:opacity-50 ${
                    settings?.maintenanceMode 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {updatingToggle === 'maintenanceMode' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {settings?.maintenanceMode ? 'Disable' : 'Enable'}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-sand-50 rounded-xl border border-sand-200">
                <div className="mb-4 sm:mb-0">
                  <h4 className="font-bold text-navy-950 mb-1">Detailed Audit Logging</h4>
                  <p className="text-xs text-navy-950/60">Log all read/write operations for compliance.</p>
                </div>
                <button 
                  disabled={!settings || updatingToggle === 'detailedAuditLogging'}
                  onClick={() => toggleSetting('detailedAuditLogging')}
                  className={`flex items-center px-4 py-2 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 ${
                    settings?.detailedAuditLogging 
                      ? 'bg-navy-950 text-white hover:bg-navy-800' 
                      : 'bg-sand-200 text-navy-950 hover:bg-sand-300'
                  }`}
                >
                  {updatingToggle === 'detailedAuditLogging' ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : settings?.detailedAuditLogging ? (
                    <Check className="w-4 h-4 mr-2 text-gold-400" />
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
