import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialOpportunities } from '../data/initialData.js';

dotenv.config({
  path: path.join(process.env.SCHOLARA_CONFIG_DIR || path.join(os.homedir(), '.scholara'), 'server.env')
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const OPPS_FILE = path.join(DATA_DIR, 'opportunities.json');

export let isMongoConnected = false;
mongoose.connection.on('connected', () => {
  isMongoConnected = true;
  console.log('[Database] MongoDB connected.');
});

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.warn('[Database] MongoDB disconnected.');
});

mongoose.connection.on('error', (error) => {
  console.error('[Database] MongoDB connection error:', error.message);
});

// Initialize fallback files if they don't exist
const initFallbackData = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(OPPS_FILE)) {
    const seeded = initialOpportunities.map((item, index) => ({
      _id: `opp_${Date.now()}_${index + 1}`,
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    fs.writeFileSync(OPPS_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    console.log(`[Store] Seeded ${seeded.length} fallback opportunities to disk.`);
  }
};

const getFallbackOpportunities = () => {
  try {
    return JSON.parse(fs.readFileSync(OPPS_FILE, 'utf-8'));
  } catch (error) {
    console.error('[Database] Could not read fallback opportunities for migration:', error);
    return [];
  }
};

const migrateFallbackOpportunities = async (Opportunity) => {
  const fallbackOpportunities = getFallbackOpportunities();
  if (fallbackOpportunities.length === 0) return;

  let migrated = 0;
  let skipped = 0;
  for (const item of fallbackOpportunities) {
    const identityFilter = item.applicationUrl
      ? { applicationUrl: item.applicationUrl }
      : { title: item.title, provider: item.provider };
    const opportunityData = { ...item };
    delete opportunityData._id;
    delete opportunityData.id;
    delete opportunityData.createdAt;
    delete opportunityData.updatedAt;

    try {
      const result = await Opportunity.updateOne(
        identityFilter,
        {
          $setOnInsert: opportunityData
        },
        { upsert: true, runValidators: true }
      );
      if (result.upsertedCount > 0) migrated += 1;
    } catch (error) {
      skipped += 1;
      console.error(`[Database] Skipped fallback opportunity "${item.title}":`, error.message);
    }
  }

  if (migrated > 0) {
    console.log(`✅ [Database] Migrated ${migrated} fallback opportunities into MongoDB.`);
  }
  if (skipped > 0) {
    console.warn(`⚠️ [Database] Skipped ${skipped} fallback opportunities during migration.`);
  }
};


const migrateBannerSettings = async () => {
  if (!fs.existsSync(path.join(DATA_DIR, 'banner.json'))) return;

  const { Banner } = await import('../models/Banner.js');
  if (await Banner.exists({ key: 'homepage' })) return;

  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, 'banner.json'), 'utf-8')
    );
    await Banner.create({ key: 'homepage', data });
    console.log('[Database] Migrated banner settings into MongoDB.');
  } catch (error) {
    console.error('[Database] Could not migrate banner settings:', error.message);
  }
};

export const connectDB = async () => {
  initFallbackData();

  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scholarship_portal';
  const mongoTarget = mongoURI.startsWith('mongodb+srv://')
    ? 'MongoDB Atlas'
    : 'MongoDB local host';

  try {
    console.log(`[Database] Attempting connection to ${mongoTarget}`);

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    isMongoConnected = true;
    console.log('✅ [Database] Successfully connected to live MongoDB database!');
  } catch (error) {
    isMongoConnected = false;
    console.warn(`[Database] Live MongoDB connection failed: ${error.message}`);
    console.log(' [Database] Activating Resilient File-Backed Data Engine.');
    return;
  }

  try {
    const { Opportunity } = await import('../models/Opportunity.js');
    const count = await Opportunity.countDocuments();

    if (count === 0) {
      console.log('[Database] Seeding initial opportunities...');
      await Opportunity.insertMany(initialOpportunities);
    }

    await migrateFallbackOpportunities(Opportunity);
    await migrateBannerSettings();

  } catch (error) {
    console.error('[Database] Seeding or migration failed:', error.message);
  }
};

