import React, { useState, useEffect } from 'react';
import { Search, Shield, User, Hotel, MapPin, CheckCircle, XCircle, MoreVertical, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { Button } from '../../../components/ui/Button';
import toast from 'react-hot-toast';

type Role = 'TRAVELLER' | 'RESORT_OWNER' | 'GUIDE' | 'ADMIN';

import { ErrorBoundary } from '../../../components/shared/ErrorBoundary';

export function UserManagement() {
  const [activeRole, setActiveRole] = useState<Role>('TRAVELLER');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setUsers([]);
    try {
      const data = await apiClient.get<any>(`/admin/users?role=${activeRole}&page=${page}&limit=10&search=${searchQuery}`);
      setUsers(data.users || []);
      setTotalCount(data.totalCount || 0);
      setVerifiedCount(data.verifiedCount || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      console.error('API Error fetching users:', err);
      toast.error(`Failed to load ${activeRole.toLowerCase()}s. Please try again.`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [activeRole, page, searchQuery]);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}?`)) return;
    setProcessingId(id);
    try {
      await apiClient.delete(`/admin/users/${id}`);
      toast.success(`${name} deleted successfully`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setProcessingId(null);
    }
  };

  const tabs: { id: Role, label: string, icon: React.ReactNode }[] = [
    { id: 'TRAVELLER', label: 'Travellers', icon: <User className="w-4 h-4" /> },
    { id: 'RESORT_OWNER', label: 'Resort Owners', icon: <Hotel className="w-4 h-4" /> },
    { id: 'GUIDE', label: 'Local Guides', icon: <MapPin className="w-4 h-4" /> },
    { id: 'ADMIN', label: 'Administrators', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* Top Header & Analytics */}
      <div className="bg-white  rounded-[2.5rem] border border-sand-200  shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-cinematic text-navy-950 ">User Management</h2>
          <p className="text-navy-950   mt-2">Manage all platform roles, view analytics, and control access.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-sand-50  rounded-2xl p-4 min-w-[120px] border border-sand-100  text-center">
            <p className="text-sm text-navy-950   font-bold uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-cinematic text-navy-950 ">{totalCount}</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 min-w-[120px] border border-emerald-100 text-center">
            <p className="text-sm text-emerald-600/70 font-bold uppercase tracking-wider mb-1">Verified</p>
            <p className="text-3xl font-cinematic text-emerald-700">{verifiedCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white  rounded-[2.5rem] border border-sand-200  shadow-sm overflow-hidden">
        <div className="p-4 border-b border-sand-100  bg-sand-50  flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveRole(tab.id); setPage(1); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  activeRole === tab.id 
                    ? 'bg-navy-950 text-white shadow-md' 
                    : 'text-navy-950   hover:bg-sand-100 :bg-zinc-700 hover:text-navy-950 '
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-navy-950   absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white  border border-sand-200  rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 transition-shadow"
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-navy-950  ">
              <User className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg italic">No {activeRole.toLowerCase()}s found.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sand-50  text-[10px] font-bold text-navy-950   uppercase tracking-widest">
                  <th className="px-8 py-4">User Details</th>
                  <th className="px-8 py-4">
                    {activeRole === 'TRAVELLER' ? 'Engagement' : activeRole === 'RESORT_OWNER' ? 'Business' : activeRole === 'GUIDE' ? 'Specialty' : 'Permissions'}
                  </th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {Array.isArray(users) && users.map(user => (
                  user ? (
                  <tr key={user?.id} className="hover:bg-sand-50 :bg-zinc-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                          {user?.avatar ? <img src={user?.avatar} className="w-full h-full object-cover" /> : (user?.name ? user?.name[0] : '?')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy-950  flex items-center gap-2">
                            {user?.name}
                            {user?.role === 'ADMIN' && <Shield className="w-3 h-3 text-red-500" />}
                          </p>
                          <p className="text-xs text-navy-950   mt-0.5">{user?.email}</p>
                          <p className="text-[10px] text-navy-950   mt-1 uppercase tracking-wider">Joined: {new Date(user?.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {activeRole === 'TRAVELLER' && (
                        <div className="flex gap-4 text-xs font-bold text-navy-950  ">
                          <div className="bg-sand-100  px-3 py-1.5 rounded-lg text-center">
                            <p className="text-navy-950  text-base">{user?._count?.bookings || 0}</p>
                            <p className="text-[9px] uppercase tracking-wider">Bookings</p>
                          </div>
                          <div className="bg-sand-100  px-3 py-1.5 rounded-lg text-center">
                            <p className="text-navy-950  text-base">{user?._count?.wishlist || 0}</p>
                            <p className="text-[9px] uppercase tracking-wider">Wishlist</p>
                          </div>
                        </div>
                      )}
                      {activeRole === 'RESORT_OWNER' && (
                        <div>
                          <p className="text-sm font-bold text-navy-950 ">{user?.ownerProfile?.businessName || 'No Company Name'}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-bold text-navy-950   bg-sand-100  px-2 py-0.5 rounded-md">
                              {user?.ownerProfile?._count?.resorts || 0} Resorts
                            </span>
                            <span className="text-[10px] font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-md">
                              {user?.ownerProfile?.commissionRate || 7}% Comm.
                            </span>
                          </div>
                        </div>
                      )}
                      {activeRole === 'GUIDE' && (
                        <div>
                          <p className="text-xs text-navy-950   font-bold mb-1">
                            {user?.guideProfile?.specialties?.[0] || 'General Guide'}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {(user?.guideProfile?.languages || []).slice(0, 3).map((l: string) => (
                              <span key={l} className="text-[9px] bg-navy-50 text-navy-700 px-1.5 py-0.5 rounded border border-navy-100 uppercase tracking-widest">{l}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeRole === 'ADMIN' && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                          Super Admin
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        {user?.deletedAt ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-600">
                            <XCircle className="w-3 h-3" /> SUSPENDED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                            <CheckCircle className="w-3 h-3" /> ACTIVE
                          </span>
                        )}
                        {(user?.verifiedEmail || user?.isEmailVerified) ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600">
                            <Shield className="w-3 h-3" /> VERIFIED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                            <AlertTriangle className="w-3 h-3" /> UNVERIFIED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          className="h-8 px-4 text-xs rounded-full border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user?.id, user?.name)}
                          isLoading={processingId === user?.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ) : null
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-sand-100  bg-sand-50  flex items-center justify-between">
            <p className="text-xs font-bold text-navy-950   uppercase tracking-widest">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-4 text-xs rounded-full"
              >
                Prev
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-4 text-xs rounded-full"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}

