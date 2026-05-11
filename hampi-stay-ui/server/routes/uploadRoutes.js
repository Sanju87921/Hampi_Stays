import express from 'express';
import multer from 'multer';
import * as uploadController from '../controllers/uploadController.js';
import { authenticate } from '../middleware/security.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(authenticate);

router.get('/signature', uploadController.getSignature);
router.post('/', upload.single('image'), uploadController.uploadFile);

export default router;
