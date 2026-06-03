import { API_BASE_URL } from '../config/api';

export async function uploadToCloudinary(file: File, type: string = 'resort_photo'): Promise<{ url: string }> {
  const token = localStorage.getItem('hampi-token');

  const fetchWithDetailedError = async (url: string, options: RequestInit, stepName: string) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        let errMsg = `${res.status} ${res.statusText}`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch(e) {}
        throw new Error(`${stepName} Failed: ${errMsg}`);
      }
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const sigRes = await fetchWithDetailedError(`${API_BASE_URL}/upload/signature?type=${type}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }, "Signature Fetch");
  
  const sigData = await sigRes.json();
  
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sigData.api_key);
  fd.append('timestamp', sigData.timestamp);
  fd.append('signature', sigData.signature);
  fd.append('folder', sigData.folder);
  if (sigData.eager) fd.append('eager', sigData.eager);
  if (sigData.type) fd.append('type', sigData.type);

  const uploadRes = await fetchWithDetailedError(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
    method: 'POST',
    body: fd,
  }, "Cloudinary Upload");
  
  const uploadData = await uploadRes.json();
  return { url: uploadData.secure_url };
}
