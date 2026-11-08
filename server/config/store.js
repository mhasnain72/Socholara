import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { isMongoConnected } from './db.js';
import Opportunity from '../models/Opportunity.js';
import MatcherContactProfile from '../models/MatcherContactProfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const OPPS_FILE = path.join(DATA_DIR, 'opportunities.json');
const PRIVATE_DATA_DIR = process.env.SCHOLARA_DATA_DIR || path.join(os.homedir(), '.scholara', 'data');
const MATCHER_CONTACT_PROFILES_FILE = path.join(PRIVATE_DATA_DIR, 'matcherContactProfiles.json');

const readJSON = (file) => {
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const writeJSON = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing to ${file}:`, err);
  }
};

export const Store = {
  async getMatcherContactProfiles(limit = 500) {
    if (isMongoConnected) {
      const [count, data] = await Promise.all([
        MatcherContactProfile.countDocuments(),
        MatcherContactProfile.find()
          .sort({ updatedAt: -1 })
          .limit(limit)
          .select('email phone highestDegree desiredCountry createdAt updatedAt')
          .lean()
      ]);
      return { count, data };
    }

    const profiles = readJSON(MATCHER_CONTACT_PROFILES_FILE)
      .sort((first, second) => new Date(second.updatedAt || 0) - new Date(first.updatedAt || 0));
    return { count: profiles.length, data: profiles.slice(0, limit) };
  },

  async upsertMatcherContactProfile(profile) {
    const limitedProfile = {
      email: profile.email.toLowerCase(),
      phone: profile.phone,
      highestDegree: profile.highestDegree,
      desiredCountry: profile.desiredCountry
    };

    if (isMongoConnected) {
      return await MatcherContactProfile.findOneAndUpdate(
        { email: limitedProfile.email },
        { $set: limitedProfile },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).lean();
    }

    const profiles = readJSON(MATCHER_CONTACT_PROFILES_FILE);
    const index = profiles.findIndex((item) => item.email?.toLowerCase() === limitedProfile.email);
    const savedProfile = {
      ...(index >= 0 ? profiles[index] : {}),
      ...limitedProfile,
      createdAt: index >= 0 ? profiles[index].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (index >= 0) profiles[index] = savedProfile;
    else profiles.push(savedProfile);

    fs.mkdirSync(PRIVATE_DATA_DIR, { recursive: true });
    fs.writeFileSync(MATCHER_CONTACT_PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
    return savedProfile;
  },

  // Opportunities
  async getOpportunities(query = {}) {
    if (isMongoConnected) {
      const filter = {};
      if (query.type && query.type !== 'All') {
        filter.type = query.type;
      }
      if (query.category && query.category !== 'All') {
        filter.category = query.category;
      }
      if (query.workMode && query.workMode !== 'All') {
        filter.workMode = query.workMode;
      }
      if (query.status && query.status !== 'All') {
        filter.status = query.status;
      }
      if (query.degreeLevel && query.degreeLevel !== 'All') {
        filter.degreeLevel = query.degreeLevel;
      }
      if (query.search) {
        const regex = new RegExp(query.search, 'i');
        filter.$or = [
          { title: regex },
          { provider: regex },
          { shortDescription: regex },
          { location: regex },
          { category: regex },
          { tags: regex }
        ];
      }

      let sortOption = { createdAt: -1 };
      if (query.sort === 'deadline') {
        sortOption = { deadline: 1 };
      } else if (query.sort === 'popular') {
        sortOption = { views: -1 };
      } else if (query.sort === 'title') {
        sortOption = { title: 1 };
      }

      return await Opportunity.find(filter).sort(sortOption).lean();
    } else {
      // JSON Fallback
      let items = readJSON(OPPS_FILE);

      if (query.type && query.type !== 'All') {
        items = items.filter(item => item.type === query.type);
      }
      if (query.category && query.category !== 'All') {
        items = items.filter(item => item.category === query.category);
      }
      if (query.workMode && query.workMode !== 'All') {
        items = items.filter(item => item.workMode === query.workMode);
      }
      if (query.status && query.status !== 'All') {
        items = items.filter(item => item.status === query.status);
      }
      if (query.degreeLevel && query.degreeLevel !== 'All') {
        items = items.filter(item => item.degreeLevel === query.degreeLevel);
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        items = items.filter(item => 
          (item.title && item.title.toLowerCase().includes(s)) ||
          (item.provider && item.provider.toLowerCase().includes(s)) ||
          (item.shortDescription && item.shortDescription.toLowerCase().includes(s)) ||
          (item.location && item.location.toLowerCase().includes(s)) ||
          (item.category && item.category.toLowerCase().includes(s)) ||
          (item.tags && item.tags.some(t => t.toLowerCase().includes(s)))
        );
      }

      if (query.sort === 'deadline') {
        items.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      } else if (query.sort === 'popular') {
        items.sort((a, b) => (b.views || 0) - (a.views || 0));
      } else if (query.sort === 'title') {
        items.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else {
        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }

      return items;
    }
  },

  async getOpportunityById(id) {
    if (isMongoConnected) {
      if (!mongoose.isValidObjectId(id)) {
        const fallbackItems = readJSON(OPPS_FILE);
        const fallbackOpportunity = fallbackItems.find(item => item._id === id || item.id === id);
        if (fallbackOpportunity) {
          fallbackOpportunity.views = (fallbackOpportunity.views || 0) + 1;
          writeJSON(OPPS_FILE, fallbackItems);
          return fallbackOpportunity;
        }
        return null;
      }
      const opp = await Opportunity.findById(id);
      if (opp) {
        opp.views = (opp.views || 0) + 1;
        await opp.save();
        return opp.toObject();
      }
      return null;
    } else {
      const items = readJSON(OPPS_FILE);
      const found = items.find(item => item._id === id || item.id === id);
      if (found) {
        found.views = (found.views || 0) + 1;
        writeJSON(OPPS_FILE, items);
      }
      return found || null;
    }
  },

  async createOpportunity(data) {
    if (isMongoConnected) {
      const created = new Opportunity(data);
      return await created.save();
    } else {
      const items = readJSON(OPPS_FILE);
      const newOpp = {
        _id: `opp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        ...data,
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      items.unshift(newOpp);
      writeJSON(OPPS_FILE, items);
      return newOpp;
    }
  },

  async updateOpportunity(id, data) {
    if (isMongoConnected) {
      return await Opportunity.findByIdAndUpdate(id, { ...data, updatedAt: new Date() }, { new: true, runValidators: true });
    } else {
      const items = readJSON(OPPS_FILE);
      const index = items.findIndex(item => item._id === id || item.id === id);
      if (index === -1) return null;
      items[index] = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      writeJSON(OPPS_FILE, items);
      return items[index];
    }
  },

  async deleteOpportunity(id) {
    if (isMongoConnected) {
      return await Opportunity.findByIdAndDelete(id);
    } else {
      const items = readJSON(OPPS_FILE);
      const index = items.findIndex(item => item._id === id || item.id === id);
      if (index === -1) return null;
      const [deleted] = items.splice(index, 1);
      writeJSON(OPPS_FILE, items);
      return deleted;
    }
  },

  async getStats() {
    if (isMongoConnected) {
      const [total, scholarships, internships, active] = await Promise.all([
        Opportunity.countDocuments(),
        Opportunity.countDocuments({ type: 'Scholarship' }),
        Opportunity.countDocuments({ type: 'Internship' }),
        Opportunity.countDocuments({ status: 'Active' })
      ]);
      return { total, scholarships, internships, active, database: 'MongoDB Live' };
    } else {
      const opps = readJSON(OPPS_FILE);
      return {
        total: opps.length,
        scholarships: opps.filter(o => o.type === 'Scholarship').length,
        internships: opps.filter(o => o.type === 'Internship').length,
        active: opps.filter(o => o.status === 'Active').length,
        database: 'Local Resilient Engine'
      };
    }
  }
};

export default Store;
