import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import { API_BASE_URL } from "../../config/api";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ onUploadSuccess, label, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload directly to Cloudinary using signed signature
    setIsUploading(true);
    
    try {
      const token = localStorage.getItem("hampi-token");
      
      // 1. Get Signature
      const sigRes = await fetch(`${API_BASE_URL}/upload/signature`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!sigRes.ok) throw new Error("Failed to get upload signature");
      const sigData = await sigRes.json();
      
      // 2. Upload to Cloudinary
      const uploadFd = new FormData();
      uploadFd.append('file', file);
      uploadFd.append('api_key', sigData.api_key);
      uploadFd.append('timestamp', sigData.timestamp);
      uploadFd.append('signature', sigData.signature);
      uploadFd.append('folder', sigData.folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`, {
        method: "POST",
        body: uploadFd,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Upload failed");

      onUploadSuccess(data.secure_url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please check your Cloudinary credentials.");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-xs font-bold text-navy-950   uppercase tracking-widest ml-1">{label}</label>}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed border-sand-200  rounded-3xl p-4 transition-all hover:border-gold-400 hover:bg-gold-50/30 overflow-hidden min-h-[160px] flex flex-col items-center justify-center gap-3",
          preview && "border-solid border-gold-500"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />

        {preview ? (
          <div className="absolute inset-0 w-full h-full">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-navy-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <p className="text-white text-xs font-bold flex items-center gap-2">
                <Upload className="w-4 h-4" /> Change Image
              </p>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-white  flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-gold-600" />
                <p className="text-[10px] font-bold text-navy-950  uppercase">Uploading to Cloudinary...</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-sand-50  flex items-center justify-center text-navy-950   group-hover:text-gold-500 group-hover:bg-white  transition-all shadow-sm">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-navy-950 ">Click to upload photo</p>
              <p className="text-[10px] text-navy-950   font-medium">PNG, JPG, or WEBP (Max 5MB)</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

