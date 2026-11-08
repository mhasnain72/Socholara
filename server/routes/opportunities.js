import express from 'express';
import { Store } from '../config/store.js';
import { requireAdminSession } from './admin.js';

const router = express.Router();

// GET /api/opportunities/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Store.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching statistics' });
  }
});

// GET /api/opportunities
router.get('/', async (req, res) => {
  try {
    const opportunities = await Store.getOpportunities(req.query);
    res.json({
      success: true,
      count: opportunities.length,
      data: opportunities
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ success: false, message: 'Server error fetching opportunities' });
  }
});

// GET /api/opportunities/:id
router.get('/:id', async (req, res) => {
  try {
    const opportunity = await Store.getOpportunityById(req.params.id);
    if (!opportunity) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    res.json({ success: true, data: opportunity });
  } catch (error) {
    console.error('Error fetching opportunity detail:', error);
    res.status(500).json({ success: false, message: 'Server error fetching opportunity details' });
  }
});

// POST /api/opportunities (Admin create)
router.post('/', requireAdminSession, async (req, res) => {
  try {
    const {
      title,
      type,
      provider,
      providerLogo,
      coverPhoto,
      category,
      awardAmount,
      location,
      workMode,
      degreeLevel,
      deadline,
      shortDescription,
      fullDescription,
      eligibility,
      benefits,
      requirements,
      applicationUrl,
      contactEmail,
      tags,
      status,
      isFeatured
    } = req.body;

    if (!title || !type || !provider || !coverPhoto || !shortDescription || !fullDescription || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, type, provider, cover photo, deadline, and descriptions.'
      });
    }

    const newOpportunity = await Store.createOpportunity({
      title,
      type,
      provider,
      providerLogo: providerLogo || '',
      coverPhoto,
      category: category || 'General & Interdisciplinary',
      awardAmount: awardAmount || 'Fully Funded',
      location: location || 'Global',
      workMode: workMode || 'On-site',
      degreeLevel: degreeLevel || 'Undergraduate',
      deadline: new Date(deadline),
      shortDescription,
      fullDescription,
      eligibility: Array.isArray(eligibility) ? eligibility : (eligibility ? eligibility.split('\n').filter(Boolean) : []),
      benefits: Array.isArray(benefits) ? benefits : (benefits ? benefits.split('\n').filter(Boolean) : []),
      requirements: Array.isArray(requirements) ? requirements : (requirements ? requirements.split('\n').filter(Boolean) : []),
      applicationUrl: applicationUrl || '',
      contactEmail: contactEmail || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      status: status || 'Active',
      isFeatured: Boolean(isFeatured)
    });

    res.status(201).json({
      success: true,
      message: 'Opportunity created successfully',
      data: newOpportunity
    });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating opportunity' });
  }
});

// PUT /api/opportunities/:id (Admin update)
router.put('/:id', requireAdminSession, async (req, res) => {
  try {
    const updated = await Store.updateOpportunity(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    res.json({
      success: true,
      message: 'Opportunity updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating opportunity' });
  }
});

// DELETE /api/opportunities/:id (Admin delete)
router.delete('/:id', requireAdminSession, async (req, res) => {
  try {
    const deleted = await Store.deleteOpportunity(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Opportunity not found' });
    }
    res.json({
      success: true,
      message: 'Opportunity deleted successfully',
      data: deleted
    });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ success: false, message: 'Error deleting opportunity' });
  }
});

export default router;
