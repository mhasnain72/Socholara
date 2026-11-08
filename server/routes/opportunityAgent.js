import express from 'express';
import dotenv from 'dotenv';
import { requireAdminSession } from './admin.js';
import { Store } from '../config/store.js';

dotenv.config();
const router = express.Router();
const agentUrl = process.env.OPPORTUNITY_AGENT_URL || 'http://localhost:8000';

const forward = async (req, res) => {
  const proxyPath = req.originalUrl.replace(/^\/api\/opportunity-agent/, '');
  const path = proxyPath === '/status'
    ? '/api/agent/status'
    : proxyPath === '/agent/run'
      ? '/api/agent/run'
      : `/api${proxyPath}`;
  const target = `${agentUrl}${path}`;
  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Key': process.env.OPPORTUNITY_AGENT_KEY || ''
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
    });
    const body = await response.text();
    if (response.ok && req.method === 'POST' && req.path.endsWith('/review')) {
      const reviewed = JSON.parse(body);
      if (reviewed.status === 'approved') {
        const published = await Store.createOpportunity({
          title: reviewed.title,
          type: reviewed.type === 'internship' ? 'Internship' : 'Scholarship',
          provider: reviewed.source,
          coverPhoto: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
          category: 'General & Interdisciplinary',
          awardAmount: reviewed.type === 'scholarship' ? 'Scholarship funding' : 'Paid / see source',
          location: 'Global',
          workMode: 'On-site',
          degreeLevel: 'All Levels',
          deadline: reviewed.deadline ? new Date(reviewed.deadline) : null,
          shortDescription: reviewed.summary.slice(0, 280),
          fullDescription: reviewed.summary,
          eligibility: reviewed.eligibility ? [reviewed.eligibility] : [],
          benefits: [],
          requirements: [],
          applicationUrl: reviewed.source_url,
          tags: [reviewed.type],
          status: 'Active',
          isFeatured: false
        });
        reviewed.publishedOpportunityId = published._id || published.id;
        return res.status(response.status).json(reviewed);
      }
    }
    res.status(response.status).type(response.headers.get('content-type') || 'application/json').send(body);
  } catch (error) {
    console.error('[Opportunity Agent Proxy] Request failed:', error);
    res.status(502).json({ detail: 'Opportunity agent is unavailable.' });
  }
};

router.get('/opportunities', requireAdminSession, forward);
router.get('/status', requireAdminSession, forward);
router.post('/opportunities/:id/review', requireAdminSession, forward);
router.post('/agent/run', requireAdminSession, forward);

export default router;
