import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdminSession } from './admin.js';
import Banner from '../models/Banner.js';
import { isMongoConnected } from '../config/db.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BANNER_FILE = path.join(__dirname, '..', 'data', 'banner.json');

const defaultBanner = {
  badgeText: "Verified Opportunities • 2026/2027 Academic & Career Cycle",
  headline: "Find Prestigious Scholarships & Top-Tier Internships",
  headlineHighlight: "Top-Tier Internships",
  subtitle: "Direct access to world-class academic fellowships, tuition grants, and paid industry internships with complete criteria, deadline alerts, and verified application guides.",
  bannerHeight: "normal",
  backgroundImage: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2400&q=85",
  backgroundImageFit: "cover",
  scholarshipBannerImage: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1600&q=85",
  internshipBannerImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=85",
  typeBannerImageFit: "cover",
  trendingTags: [
    "Fully Funded",
    "Computer Science",
    "Engineering",
    "Remote",
    "Business",
    "Master",
    "PhD"
  ],
  customHighlights: [
    { label: "Verified Awards", value: "100%" },
    { label: "Average Funding", value: "$28,000+" },
    { label: "Global Universities", value: "60+" },
    { label: "Success Rate", value: "94%" }
  ],
  useAutoStats: true
};

const getBannerData = () => {
  try {
    if (fs.existsSync(BANNER_FILE)) {
      const raw = fs.readFileSync(BANNER_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading banner file:', err);
  }
  return defaultBanner;
};

// GET /api/banner
router.get('/', async (req, res) => {
  try {
    let data = getBannerData();
    if (isMongoConnected) {
      const saved = await Banner.findOne({ key: 'homepage' }).lean();
      if (saved?.data) data = saved.data;
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ success: false, message: 'Server error fetching banner settings' });
  }
});

// PUT /api/banner (Admin update)
router.put('/', requireAdminSession, async (req, res) => {
  try {
    const updated = {
      ...defaultBanner,
      ...req.body
    };
    if (isMongoConnected) {
      await Banner.findOneAndUpdate(
        { key: 'homepage' },
        { key: 'homepage', data: updated },
        { upsert: true, new: true, runValidators: true }
      );
    } else {
      fs.writeFileSync(BANNER_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    }
    res.json({
      success: true,
      message: 'Banner settings updated successfully!',
      data: updated
    });
  } catch (error) {
    console.error('Error saving banner settings:', error);
    res.status(500).json({ success: false, message: 'Server error saving banner settings' });
  }
});

export default router;
