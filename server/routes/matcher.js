import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { Store } from '../config/store.js';

const router = express.Router();
const googleClient = new OAuth2Client();

router.post('/verify', async (req, res) => {
  const { idToken, email, phone, highestDegree, desiredCountry } = req.body || {};
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return res.status(503).json({ success: false, message: 'Google sign-in is not configured on the server.' });
  }
  if (!idToken || typeof email !== 'string' || !email.trim() || typeof phone !== 'string'
    || phone.replace(/\D/g, '').length < 7 || typeof highestDegree !== 'string'
    || !highestDegree.trim() || typeof desiredCountry !== 'string' || !desiredCountry.trim()) {
    return res.status(400).json({ success: false, message: 'A valid phone, highest degree, and preferred country are required.' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
    const identity = ticket.getPayload();
    if (!identity?.sub || !identity.email || identity.email_verified !== true) {
      return res.status(401).json({ success: false, message: 'Google did not provide a verified email address.' });
    }

    const verifiedEmail = identity.email.toLowerCase();
    if (verifiedEmail !== email.trim().toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Use the same email in your profile and Google sign-in.' });
    }

    await Store.upsertMatcherContactProfile({
      email: verifiedEmail,
      phone: phone.trim().slice(0, 40),
      highestDegree: highestDegree.trim().slice(0, 100),
      desiredCountry: desiredCountry.trim().slice(0, 100)
    });

    res.json({
      success: true,
      message: 'Google email verified. Only your email, phone, highest degree, and preferred country were saved.',
      data: { name: identity.name || '', email: verifiedEmail }
    });
  } catch (error) {
    if (error?.name === 'Token used too early' || error?.message?.includes('Token used too early')) {
      return res.status(401).json({ success: false, message: 'Google sign-in token is not valid yet. Please try again.' });
    }
    if (error?.name === 'Error' && /token|audience|issuer|signature/i.test(error.message || '')) {
      return res.status(401).json({ success: false, message: 'Google sign-in could not be verified. Please try again.' });
    }
    console.error('Error verifying matcher account:', error);
    res.status(500).json({ success: false, message: 'Could not verify your account. Please try again.' });
  }
});

export default router;