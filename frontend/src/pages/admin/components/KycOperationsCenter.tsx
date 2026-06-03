import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, FileText, CheckCircle, XCircle, Eye, ExternalLink, Loader2, Search, Filter, ZoomIn, ZoomOut, RotateCw, Download, CheckSquare, Square, History, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import toast from 'react-hot-toast';

export function KycOperationsCenter() {
  const [guideDocs, setGuideDocs] = useState<any[]>([]);
  const [ownerDocs, setOwnerDocs] = useState<any[]>([]);
  const [travellerDocs, setTravellerDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'guides' | 'owners' | 'travellers'>('guides');

  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Document viewer state
  const [docLoadError, setDocLoadError] = useState(false);

  // Bulk Operations
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Filtering and Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED">("ALL");

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    let anyFailed = false;

    const [guidesResult, ownersResult, travellersResult] = await Promise.allSettled([
      apiClient.get<any[]>('/admin/kyc/guides'),
      apiClient.get<any[]>('/admin/kyc/resorts'),
      apiClient.get<any[]>('/admin/kyc/travellers')
    ]);

    if (guidesResult.status === 'fulfilled') {
      setGuideDocs(guidesResult.value || []);
    } else {
      console.error('[KYC] Failed to load guide documents:', guidesResult.reason);
      anyFailed = true;
    }

    if (ownersResult.status === 'fulfilled') {
      setOwnerDocs(ownersResult.value || []);
    } else {
      console.error('[KYC] Failed to load resort owner documents:', ownersResult.reason);
      anyFailed = true;
    }

    if (travellersResult.status === 'fulfilled') {
      setTravellerDocs(travellersResult.value || []);
    } else {
      console.error('[KYC] Failed to load traveller documents:', travellersResult.reason);
      anyFailed = true;
    }

    if (anyFailed) {
      toast.error("Some KYC data failed to load. Check browser console for details.");
    }

    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, type: 'guides' | 'owners' | 'travellers', status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    if (status === 'REJECTED' && !reason) {
      setRejectingDocId(id);
      setRejectionReason("");
      return;
    }
    
    setProcessingId(id);
    try {
      const apiType = type === 'owners' ? 'resorts' : type;
      await apiClient.patch(`/admin/kyc/${apiType}/${id}`, { status, rejectionReason: reason });
      toast.success(`Document ${status.toLowerCase()} successfully!`);
      fetchDocs();
      setRejectingDocId(null);
      setSelectedDoc(null);
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedDocs.size === 0) return;
    try {
      const type = activeTab;
      const apiType = type === 'owners' ? 'resorts' : type;
      await Promise.all(Array.from(selectedDocs).map(id => 
        apiClient.patch(`/admin/kyc/${apiType}/${id}`, { status: 'VERIFIED' })
      ));
      toast.success(`Successfully verified ${selectedDocs.size} documents.`);
      setSelectedDocs(new Set());
      fetchDocs();
    } catch (err) {
      toast.error("Failed to bulk verify.");
    }
  };

  const currentDocs = activeTab === 'guides' ? guideDocs : activeTab === 'travellers' ? travellerDocs : ownerDocs;
  
  // Analytics
  const pendingCount = currentDocs.filter(d => d.status === 'PENDING').length;
  const verifiedCount = currentDocs.filter(d => d.status === 'VERIFIED').length;
  const rejectedCount = currentDocs.filter(d => d.status === 'REJECTED').length;
  const totalCount = currentDocs.length;

  const filteredDocs = currentDocs.filter(doc => {
    if (filterStatus !== "ALL" && doc.status !== filterStatus) return false;
    if (searchQuery) {
      const user = activeTab === 'guides' ? doc.guideProfile?.user : activeTab === 'travellers' ? doc.user : doc.owner?.user;
      const q = searchQuery.toLowerCase();
      if (!user?.name?.toLowerCase().includes(q) && !user?.email?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const pendingDocs = filteredDocs.filter(d => d.status === 'PENDING');
  const historyDocs = filteredDocs.filter(d => d.status !== 'PENDING');

  const toggleDocSelection = (id: string) => {
    const next = new Set(selectedDocs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedDocs(next);
  };

  const handleSelectAll = (docs: any[]) => {
    if (selectedDocs.size === docs.length && docs.length > 0) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(docs.map(d => d.id)));
    }
  };

  // ── Document type helpers ────────────────────────────────────────────────
  const isPdf = (url: string) => {
    if (!url) return false;
    // Check URL path or Cloudinary resource_type hints
    const lower = url.toLowerCase();
    return lower.includes('.pdf') || lower.includes('/raw/upload/') || lower.includes('resource_type=raw');
  };

  return (
    <div className="space-y-8">
      {/* Analytics KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-sand-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-amber-600">
            <Loader2 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Pending Reviews</span>
          </div>
          <p className="text-3xl font-bold text-navy-950">{pendingCount}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-sand-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Verified Docs</span>
          </div>
          <p className="text-3xl font-bold text-navy-950">{verifiedCount}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-sand-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-red-600">
            <XCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Rejected Docs</span>
          </div>
          <p className="text-3xl font-bold text-navy-950">{rejectedCount}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-sand-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-navy-600">
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Uploads</span>
          </div>
          <p className="text-3xl font-bold text-navy-950">{totalCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-navy-950">KYC Operations Center</h3>
            <p className="text-sm text-navy-950">Review, verify and bulk manage identity documents.</p>
          </div>
          
          <div className="flex bg-sand-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('guides'); setSelectedDocs(new Set()); }}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'guides' ? 'bg-white shadow-sm text-navy-950' : 'text-navy-950/60'}`}
            >
              Guides
            </button>
            <button
              onClick={() => { setActiveTab('owners'); setSelectedDocs(new Set()); }}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'owners' ? 'bg-white shadow-sm text-navy-950' : 'text-navy-950/60'}`}
            >
              Resort Owners
            </button>
            <button
              onClick={() => { setActiveTab('travellers'); setSelectedDocs(new Set()); }}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'travellers' ? 'bg-white shadow-sm text-navy-950' : 'text-navy-950/60'}`}
            >
              Travellers
            </button>
          </div>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center bg-sand-50 p-4 rounded-2xl">
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-950/40" />
              <input 
                type="text" 
                placeholder="Search user..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-white border border-sand-200 rounded-xl pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>
            <div className="w-48">
              <Select 
                value={filterStatus} 
                onChange={val => setFilterStatus(val as any)}
                options={[
                  { value: "ALL", label: "All Status" },
                  { value: "PENDING", label: "Pending" },
                  { value: "VERIFIED", label: "Verified" },
                  { value: "REJECTED", label: "Rejected" }
                ]}
              />
            </div>
          </div>
          
          {selectedDocs.size > 0 && (
            <div className="flex items-center gap-3 w-full md:w-auto bg-white border border-sand-200 px-4 py-2 rounded-xl">
              <span className="text-xs font-bold text-navy-950">{selectedDocs.size} selected</span>
              <Button variant="custom" onClick={handleBulkApprove} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 shadow-sm text-xs text-white" disabled={selectedDocs.size === 0}>
                Approve Selected
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sand-100 text-[10px] font-bold text-navy-950 uppercase tracking-widest">
                  <th className="px-6 py-4 w-12">
                    <button onClick={() => handleSelectAll(pendingDocs)}>
                      {selectedDocs.size === pendingDocs.length && pendingDocs.length > 0 ? <CheckSquare className="w-5 h-5 text-gold-600" /> : <Square className="w-5 h-5 text-navy-950/40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Document Type</th>
                  <th className="px-6 py-4">Uploaded At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {pendingDocs.map(doc => {
                  const user = activeTab === 'guides' ? doc.guideProfile?.user : activeTab === 'travellers' ? doc.user : doc.owner?.user;
                  const isSelected = selectedDocs.has(doc.id);
                  return (
                    <tr key={doc.id} className={`transition-colors ${isSelected ? 'bg-gold-50' : 'hover:bg-sand-50'}`}>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleDocSelection(doc.id)}>
                          {isSelected ? <CheckSquare className="w-5 h-5 text-gold-600" /> : <Square className="w-5 h-5 text-navy-950/40" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-navy-950">{user?.name || 'Unknown'}</p>
                        <p className="text-xs text-navy-950/60">{user?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-navy-50 text-navy-700 rounded-full text-xs font-bold uppercase tracking-wider">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-navy-950">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                          <Loader2 className="w-4 h-4" /> {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="custom" 
                          onClick={() => {
                            console.log('[KYC Admin] Opening document viewer.');
                            console.log('[KYC Admin] Document ID:', doc.id);
                            console.log('[KYC Admin] Document URL (from backend):', doc.documentUrl);
                            console.log('[KYC Admin] Document type field:', doc.type);
                            console.log('[KYC Admin] Full document object:', doc);
                            setSelectedDoc({ ...doc, user, targetType: activeTab });
                            setZoomLevel(1);
                            setRotation(0);
                            setDocLoadError(false);
                          }}
                          className="h-8 text-xs rounded-lg px-4 border-sand-200 hover:border-gold-500 hover:text-gold-600"
                        >
                          <Eye className="w-4 h-4 mr-2" /> Review
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {pendingDocs.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-navy-950 italic">No pending documents to review.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-sand-200 shadow-sm mt-8">
        <div className="mb-8 flex items-center gap-3">
          <History className="w-6 h-6 text-navy-950" />
          <div>
            <h3 className="text-xl font-bold text-navy-950">Verification History</h3>
            <p className="text-sm text-navy-950">Audit log of previously reviewed documents.</p>
          </div>
        </div>
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-sand-50 text-[10px] font-bold text-navy-950 uppercase tracking-widest">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Document Type</th>
                  <th className="px-6 py-4">Uploaded At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {historyDocs.map(doc => {
                  const user = activeTab === 'guides' ? doc.guideProfile?.user : activeTab === 'travellers' ? doc.user : doc.owner?.user;
                  return (
                    <tr key={doc.id} className="hover:bg-sand-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-navy-950">{user?.name || 'Unknown'}</p>
                        <p className="text-xs text-navy-950/60">{user?.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-navy-50 text-navy-700 rounded-full text-xs font-bold uppercase tracking-wider">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-navy-950">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${
                          doc.status === 'VERIFIED' ? 'text-emerald-600' :
                          doc.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {doc.status === 'VERIFIED' && <CheckCircle className="w-4 h-4" />}
                          {doc.status === 'REJECTED' && <XCircle className="w-4 h-4" />}
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="custom" 
                          onClick={() => { setSelectedDoc({ ...doc, user, targetType: activeTab }); setZoomLevel(1); setRotation(0); setDocLoadError(false); }}
                          className="h-8 text-xs rounded-lg px-4 border-sand-200 hover:border-gold-500 hover:text-gold-600"
                        >
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {historyDocs.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-navy-950 italic">No verification history found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-navy-950/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl h-[90vh] bg-white rounded-[2.5rem] shadow-luxury p-8 border border-sand-100 flex flex-col md:flex-row gap-8 overflow-hidden z-10"
            >
              <div className="flex-1 flex flex-col bg-sand-50 rounded-[2rem] border border-sand-200 overflow-hidden relative">
                {/* Viewer Toolbar */}
                <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white/80 backdrop-blur p-2 rounded-xl border border-sand-200 shadow-sm">
                  {!isPdf(selectedDoc.documentUrl) && (
                    <>
                      <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))} className="p-2 hover:bg-sand-100 rounded-lg text-navy-950 transition-colors">
                        <ZoomOut className="w-5 h-5" />
                      </button>
                      <button onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.25))} className="p-2 hover:bg-sand-100 rounded-lg text-navy-950 transition-colors">
                        <ZoomIn className="w-5 h-5" />
                      </button>
                      <button onClick={() => setRotation((rotation + 90) % 360)} className="p-2 hover:bg-sand-100 rounded-lg text-navy-950 transition-colors">
                        <RotateCw className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <a href={selectedDoc.documentUrl} download target="_blank" rel="noreferrer" className="p-2 hover:bg-sand-100 rounded-lg text-navy-950 transition-colors ml-2 border-l border-sand-200">
                    <Download className="w-5 h-5" />
                  </a>
                </div>
                
                <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                  {docLoadError ? (
                    /* ── Fallback: document preview unavailable ── */
                    <div className="flex flex-col items-center gap-4 text-center p-8">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-bold text-navy-950 mb-1">Document Preview Unavailable</p>
                        <p className="text-xs text-navy-950/60 max-w-xs">The document could not be loaded from Cloudinary. Use the download button above to access the file directly.</p>
                      </div>
                      <a
                        href={selectedDoc.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-navy-950 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                      </a>
                    </div>
                  ) : isPdf(selectedDoc.documentUrl) ? (
                    /* ── PDF Viewer ── */
                    <iframe
                      src={selectedDoc.documentUrl}
                      title="KYC Document"
                      className="w-full h-full rounded-xl border border-sand-200"
                      onError={() => {
                        console.error('[KYC Viewer] PDF iframe load failed:', selectedDoc.documentUrl);
                        setDocLoadError(true);
                      }}
                    />
                  ) : (
                    /* ── Image Viewer ── */
                    <motion.img 
                      src={selectedDoc.documentUrl} 
                      alt="KYC Document" 
                      animate={{ scale: zoomLevel, rotate: rotation }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="max-w-full max-h-full object-contain rounded-xl origin-center"
                      onError={(e) => {
                        console.error('[KYC Viewer] Image failed to load. URL:', selectedDoc.documentUrl);
                        setDocLoadError(true);
                      }}
                      onLoad={() => {
                        console.log('[KYC Viewer] Image loaded successfully. URL:', selectedDoc.documentUrl);
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="w-full md:w-96 flex flex-col justify-between overflow-y-auto">
                <div>
                  <h3 className="text-xl font-serif font-bold text-navy-950 mb-6">Document Details</h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-navy-950/60 block mb-1">User Name</span>
                      <p className="font-bold text-navy-950">{selectedDoc.user?.name}</p>
                      <p className="text-xs text-navy-950/60">{selectedDoc.user?.email}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-navy-950/60 block mb-1">Document Type</span>
                      <span className="px-3 py-1 bg-gold-50 text-gold-700 rounded-full text-xs font-bold uppercase tracking-wider block w-fit">
                        {selectedDoc.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-navy-950/60 block mb-1">Upload Date</span>
                      <p className="font-mono text-sm font-bold text-navy-950 bg-sand-50 px-3 py-2 rounded-xl border border-sand-100 inline-block">
                        {new Date(selectedDoc.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-navy-950/60 block mb-1">Current Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider block w-fit ${
                        selectedDoc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' :
                        selectedDoc.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {selectedDoc.status}
                      </span>
                    </div>
                    
                    {selectedDoc.status === 'REJECTED' && (
                      <div className="bg-red-50 border border-red-100 p-4 rounded-xl mt-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 block mb-1">Rejection Reason</span>
                        <p className="text-sm text-red-700 font-medium">{selectedDoc.rejectedReason || selectedDoc.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-sand-100">
                  {selectedDoc.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="custom"
                        className="flex-1 h-12 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleUpdateStatus(selectedDoc.id, selectedDoc.targetType, 'REJECTED')}
                      >
                        Reject
                      </Button>
                      <Button 
                        variant="custom"
                        className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20"
                        onClick={() => handleUpdateStatus(selectedDoc.id, selectedDoc.targetType, 'VERIFIED')}
                        isLoading={processingId === selectedDoc.id}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                  <Button 
                    variant="outline"
                    className="w-full h-12 rounded-xl border-sand-200"
                    onClick={() => setSelectedDoc(null)}
                  >
                    Close Viewer
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rejectingDocId && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectingDocId(null)}
              className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-luxury p-10 border border-sand-100 z-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-navy-950">Reject Document</h3>
                  <p className="text-xs text-navy-950/60">Provide a reason for rejection</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <textarea 
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="e.g. Document is blurry, expired, or invalid."
                    className="w-full h-32 bg-sand-50 border-2 border-sand-200 rounded-xl p-4 font-medium text-navy-950 outline-none focus:border-red-500 transition-all text-sm resize-none"
                  />
                </div>
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl"
                    onClick={() => setRejectingDocId(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="custom"
                    className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-red-600/10 animate-pulse-slow"
                    onClick={() => handleUpdateStatus(rejectingDocId, activeTab, 'REJECTED', rejectionReason)}
                    isLoading={processingId === rejectingDocId}
                    disabled={!rejectionReason.trim()}
                  >
                    Submit Rejection
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
