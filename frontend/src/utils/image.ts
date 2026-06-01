/**
 * Cloudinary Image Optimization Utility
 * Adds automatic formatting and quality adjustments for luxury performance
 */
export function optimizeImage(url: string, width: number = 800): string {
  if (!url) return "/images/placeholder.png";
  
  // If not a Cloudinary URL, return as is
  if (!url.includes("cloudinary.com")) return url;
  
  // Cloudinary optimization parameters:
  // f_auto: Automatically choose the best format (webp, avif, etc)
  // q_auto: Automatically choose the best quality/compression
  // w_xxx: Resize to specific width
  // c_fill: Fill the dimensions
  
  const parts = url.split("/upload/");
  if (parts.length !== 2) return url;
  
  return `${parts[0]}/upload/f_auto,q_auto,w_${width},c_fill/${parts[1]}`;
}

export const CLOUDINARY_TRANSFORMS = {
  THUMBNAIL: "f_auto,q_auto,w_400,c_fill",
  STANDARD: "f_auto,q_auto,w_800,c_fill",
  LARGE: "f_auto,q_auto,w_1200,c_fill",
  HERO: "f_auto,q_auto,w_1920,c_fill",
};

export const compressImageFile = (file: File, maxWidth = 1920): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

