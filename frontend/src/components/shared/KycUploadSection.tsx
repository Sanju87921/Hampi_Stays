import React, { useState, useEffect } from 'react';
import { ShieldCheck, Upload, FileText, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { apiClient } from '../../utils/apiClient';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import Tesseract from 'tesseract.js';

import { API_BASE_URL } from '../../config/api';

// Direct-to-Cloudinary Signed Upload Helper
async function uploadFile(file: File): Promise<{ url: string, extractedText: string }> {
  const token = localStorage.getItem('hampi-token');

  // Helper for detailed API error parsing
  const fetchWithDetailedError = async (url: string, options: RequestInit, stepName: string) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        let errMsg = `${res.status} ${res.statusText}`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch(e) {}
        
        if (res.status === 401) throw new Error(`${stepName} Failed: 401 Unauthorized (Session Expired)`);
        if (res.status === 403) throw new Error(`${stepName} Failed: 403 Forbidden`);
        if (res.status === 404) throw new Error(`${stepName} Failed: 404 Route Missing (${url})`);
        if (res.status === 413) throw new Error(`${stepName} Failed: 413 File Too Large`);
        throw new Error(`${stepName} Failed: ${errMsg}`);
      }
      return res;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error(`${stepName} Network Error: CORS Preflight Failed or Server Unreachable at ${url}`);
      }
      throw err; // Re-throw if we already mapped it above
    }
  };

  // Duplicate Hash Detection
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const hashCheckRes = await fetchWithDetailedError(`${API_BASE_URL}/upload/check-hash`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ hash: hashHex })
  }, "Hash Check");
  
  const hashData = await hashCheckRes.json();
  if (hashData.exists) {
    throw new Error('Duplicate Document: This document has already been uploaded.');
  }

  const sigRes = await fetchWithDetailedError(`${API_BASE_URL}/upload/signature?type=kyc`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }, "Signature Fetch");
  
  const sigData = await sigRes.json();
  
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sigData.api_key);
  fd.append('timestamp', sigData.timestamp);
  fd.append('signature', sigData.signature);
  fd.append('folder', sigData.folder);
  if (sigData.eager) {
    fd.append('eager', sigData.eager);
  }
  if (sigData.type) {
    fd.append('type', sigData.type);
  }

  const uploadRes = await fetchWithDetailedError(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
    method: 'POST',
    body: fd,
  }, "Cloudinary Upload");
  
  const uploadData = await uploadRes.json();
  
  // Save Hash URL to DB
  await fetchWithDetailedError(`${API_BASE_URL}/upload/check-hash`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ hash: hashHex, url: uploadData.secure_url })
  }, "Save Hash");

  // Optional: Run OCR if it's an image
  let extractedText = "";
  if (file.type.startsWith('image/')) {
    try {
      const result = await Tesseract.recognize(file, 'eng');
      extractedText = result.data.text;
    } catch (e) {
      console.error("OCR failed", e);
    }
  }

  return { url: uploadData.secure_url, extractedText };
}

export function KycUploadSection({ userType, profileId }: { userType: 'guide' | 'resort' | 'traveler', profileId: string }) {
  const { settings } = useSystem();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const reqs = userType === 'guide' 
    ? settings?.verificationSettings?.guideRequirements || []
    : userType === 'traveler'
    ? settings?.verificationSettings?.travellerRequirements || []
    : settings?.verificationSettings?.resortOwnerRequirements || [];
  
  // Filter out EMAIL and PHONE as they are handled in profile, we only want KYC docs
  const requiredDocs = reqs.filter(req => !['EMAIL', 'PHONE'].includes(req));

  useEffect(() => {
    if (profileId) fetchDocs();
  }, [profileId]);

  const fetchDocs = async () => {
    try {
      const endpoint = userType === 'guide' ? `/guides/${profileId}/kyc` :
                       userType === 'traveler' ? `/users/kyc` : 
                       `/resorts/${profileId}/kyc`;
      const res = await apiClient.get<any[]>(endpoint);
      setDocuments(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingType(type);
    let toastId = toast.loading('Uploading and extracting document data...');
    try {
      const { url, extractedText } = await uploadFile(file);
      const endpoint = userType === 'guide' ? `/guides/${profileId}/kyc` :
                       userType === 'traveler' ? `/users/kyc` : 
                       `/resorts/${profileId}/kyc`;
      await apiClient.post(endpoint, {
        type,
        documentUrl: url,
        extractedText
      });
      toast.success(`${type.replace('_', ' ')} uploaded successfully!`, { id: toastId });
      fetchDocs();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to upload document', { id: toastId });
    } finally {
      setUploadingType(null);
    }
  };

  const getDocStatus = (type: string) => {
    const doc = documents.find(d => d.type === type);
    if (!doc) return { status: 'MISSING', doc: null };
    return { status: doc.status, doc };
  };

  // Phase 3: Verification Progress
  const completedDocs = requiredDocs.filter(type => {
    const s = getDocStatus(type).status;
    return s === 'VERIFIED' || s === 'PENDING';
  }).length;
  
  const progressPercent = requiredDocs.length > 0 ? Math.round((completedDocs / requiredDocs.length) * 100) : 100;

  return (
    <div className="bg-white rounded-[3rem] border border-sand-100 shadow-sm p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-navy-950 mb-2">KYC & Verification</h2>
          <p className="text-sm text-navy-950/60">Upload required documents to complete your profile verification.</p>
        </div>
        
        {/* Verification Progress */}
        <div className="flex items-center gap-4 bg-sand-50 px-6 py-4 rounded-2xl border border-sand-200">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-sand-200" />
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-gold-500" strokeDasharray="125.6" strokeDashoffset={125.6 - (progressPercent / 100) * 125.6} />
            </svg>
            <span className="absolute text-[10px] font-bold text-navy-950">{progressPercent}%</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-navy-950">Verification Progress</p>
            <p className="text-[10px] text-navy-950/60 mt-1">{completedDocs} of {requiredDocs.length} documents provided</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-gold-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requiredDocs.map(type => {
            const { status, doc } = getDocStatus(type);
            
            const DOC_TITLES: Record<string, string> = {
              'AADHAAR': 'Aadhaar',
              'PAN': 'PAN',
              'PROPERTY_OWNERSHIP_PROOF': 'Property Ownership Proof',
              'BANK_VERIFICATION': 'Bank Verification',
              'GST_CERTIFICATE': 'GST Certificate',
              'TRADE_LICENSE': 'Trade License',
              'TOURISM_REGISTRATION': 'Tourism Registration',
              'FSSAI_LICENSE': 'FSSAI License',
              'ID_DOCUMENT': 'ID Document',
              'GOVERNMENT_ID': 'Government ID',
              'GUIDE_LICENSE': 'Guide License',
              'PASSPORT': 'Passport'
            };
            
            const title = DOC_TITLES[type] || type.replace(/_/g, ' ');
            
            return (
              <div key={type} className={`relative p-6 rounded-2xl border-2 transition-all ${
                status === 'VERIFIED' ? 'border-emerald-200 bg-emerald-50/30' :
                status === 'PENDING' ? 'border-amber-200 bg-amber-50/30' :
                status === 'REJECTED' ? 'border-red-200 bg-red-50/30' :
                'border-sand-200 bg-sand-50'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' :
                      status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                      status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                      'bg-white text-navy-950 shadow-sm'
                    }`}>
                      {status === 'VERIFIED' ? <CheckCircle className="w-5 h-5" /> :
                       status === 'PENDING' ? <Clock className="w-5 h-5" /> :
                       status === 'REJECTED' ? <XCircle className="w-5 h-5" /> :
                       <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-navy-950">{title}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-navy-950/60 mt-1">
                        {status === 'MISSING' ? 'Required Document' : `Status: ${status}`}
                      </p>
                    </div>
                  </div>
                </div>

                {status === 'REJECTED' && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 flex gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{doc?.rejectionReason || doc?.rejectedReason || 'Document rejected. Please upload a clearer copy.'}</span>
                  </div>
                )}

                {(status === 'MISSING' || status === 'REJECTED') && (
                  <label className={`flex items-center justify-center w-full h-12 rounded-xl border border-dashed text-sm font-bold cursor-pointer transition-all ${
                    uploadingType === type 
                      ? 'bg-sand-100 border-sand-300 text-navy-950/60' 
                      : 'bg-white border-sand-300 text-navy-950 hover:border-gold-500 hover:text-gold-600 shadow-sm'
                  }`}>
                    {uploadingType === type ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Upload {title}</>
                    )}
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, type)}
                      disabled={uploadingType === type}
                    />
                  </label>
                )}

                {status === 'VERIFIED' && (
                  <div className="w-full h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-xs font-bold text-emerald-700">
                    Document Verified & Approved
                  </div>
                )}
                {status === 'PENDING' && (
                  <div className="w-full h-12 bg-amber-50 rounded-xl flex items-center justify-center text-xs font-bold text-amber-700">
                    Under Admin Review...
                  </div>
                )}
              </div>
            );
          })}
          
          {requiredDocs.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-sand-50 rounded-2xl border border-sand-200">
              <ShieldCheck className="w-12 h-12 text-sand-300 mx-auto mb-3" />
              <p className="text-navy-950 font-bold">No documents required at this time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
