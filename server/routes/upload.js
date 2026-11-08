import express from 'express';
import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { requireAdminSession } from './admin.js';

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed.'));
  }
});

// POST /api/upload
router.post('/', requireAdminSession, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return res.status(503).json({ success: false, message: 'MongoDB is not available for image storage.' });
  }

  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
  const uploadStream = bucket.openUploadStream(req.file.originalname, {
    contentType: req.file.mimetype,
    metadata: { uploadedBy: 'admin' }
  });
  uploadStream.end(req.file.buffer);
  uploadStream.on('error', (error) => {
    console.error('MongoDB image upload error:', error);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Could not store image in MongoDB.' });
  });
  uploadStream.on('finish', () => {
    res.json({
      success: true,
      message: 'Photo uploaded to MongoDB successfully',
      url: `/api/upload/file/${uploadStream.id.toString()}`
    });
  });
});

router.get('/file/:id', async (req, res) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db || !ObjectId.isValid(req.params.id)) {
    return res.status(404).send('Image not found');
  }
  try {
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    const file = await mongoose.connection.db.collection('uploads.files').findOne({ _id: new ObjectId(req.params.id) });
    if (!file) return res.status(404).send('Image not found');
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    bucket.openDownloadStream(file._id).on('error', () => {
      if (!res.headersSent) res.status(404).send('Image not found');
    }).pipe(res);
  } catch (error) {
    console.error('MongoDB image read error:', error);
    res.status(500).send('Could not load image');
  }
});

export default router;
