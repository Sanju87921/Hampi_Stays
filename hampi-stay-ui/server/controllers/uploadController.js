import cloudinary from 'cloudinary';
import crypto from 'crypto';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generates a signed upload signature for Cloudinary.
 * This allows the frontend to upload directly without exposing the API secret.
 */
export const getSignature = (req, res, next) => {
  try {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = cloudinary.v2.utils.api_sign_request(
      { timestamp, folder: 'hampi-stays' },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder: 'hampi-stays'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Backend upload proxy with strict validation
 */
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' });
    }

    // File size limit (5MB) - already handled by multer but double check
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Max 5MB allowed.' });
    }

    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    const result = await cloudinary.v2.uploader.upload(dataURI, {
      folder: 'hampi-stays',
      resource_type: 'auto'
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    next(error);
  }
};
