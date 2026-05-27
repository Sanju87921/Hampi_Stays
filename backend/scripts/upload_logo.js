import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function main() {
  const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
  console.log('Uploading logo from:', logoPath);

  try {
    const result = await cloudinary.v2.uploader.upload(logoPath, {
      folder: 'hampi-stays',
      public_id: 'hampistays-logo',
      overwrite: true,
      resource_type: 'image'
    });

    console.log('\n==================================================');
    console.log('🎉 LOGO UPLOADED SUCCESSFULLY TO CLOUDINARY');
    console.log('==================================================');
    console.log('Secure URL:', result.secure_url);
    console.log('Transform URL (512x512 Square):', result.secure_url.replace('/upload/', '/upload/c_fill,g_center,w_512,h_512/'));
    console.log('==================================================\n');
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

main();
