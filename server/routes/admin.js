import express from 'express';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import nodemailer from 'nodemailer';
import { Store } from '../config/store.js';
import { isMongoConnected } from '../config/db.js';
import AdminSession from '../models/AdminSession.js';

const router = express.Router();
const SESSION_COOKIE = 'scholara_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();
const pendingOtps = new Map();
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const OTP_TTL_MS = 10 * 60 * 1000;
const getAdminEmail = () => (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

const getCookieValue = (req, name) => {
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : '';
};

const setSessionCookie = (res, value, maxAge) => {
  const secure = res.req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${maxAge}${secure}`);
};

export const requireAdminSession = (req, res, next) => {
  const token = getCookieValue(req, SESSION_COOKIE);
  const check = async () => {
    if (isMongoConnected) {
      const session = await AdminSession.findOne({ tokenHash: createHash('sha256').update(token).digest('hex') }).lean();
      if (!session || session.expiresAt <= new Date()) {
        return res.status(401).json({ success: false, message: 'Admin session expired. Please sign in again.' });
      }
      return next();
    }
    const expiresAt = sessions.get(token);
    if (!expiresAt || expiresAt <= Date.now()) {
      sessions.delete(token);
      return res.status(401).json({ success: false, message: 'Admin session expired. Please sign in again.' });
    }
    next();
  };
  check().catch((error) => {
    console.error('Error checking admin session:', error);
    res.status(503).json({ success: false, message: 'Could not verify admin session.' });
  });
};

const getMailer = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
};

const hashOtp = (otp) => createHash('sha256').update(otp).digest('hex');

router.post('/session/request-code', async (req, res) => {
  const configuredPasscode = process.env.ADMIN_PASSWORD;
  const adminEmail = getAdminEmail();
  if (!adminEmail || !configuredPasscode || !getMailer()) {
    return res.status(503).json({ success: false, message: 'Admin email verification is not configured on the server.' });
  }

  const clientAddress = req.ip || 'unknown';
  const attempt = loginAttempts.get(clientAddress);
  if (attempt && attempt.expiresAt > Date.now() && attempt.count >= MAX_LOGIN_ATTEMPTS) {
    return res.status(429).json({ success: false, message: 'Too many sign-in attempts. Please wait and try again.' });
  }

  const providedEmail = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const providedPasscode = typeof req.body?.password === 'string' ? req.body.password : '';
  const expectedBuffer = Buffer.from(configuredPasscode);
  const providedBuffer = Buffer.from(providedPasscode);
  const matches = expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer)
    && providedEmail === adminEmail;

  if (!matches) {
    const nextAttempt = attempt && attempt.expiresAt > Date.now()
      ? { count: attempt.count + 1, expiresAt: attempt.expiresAt }
      : { count: 1, expiresAt: Date.now() + LOGIN_WINDOW_MS };
    loginAttempts.set(clientAddress, nextAttempt);
    return res.status(401).json({ success: false, message: 'Incorrect admin passcode.' });
  }

  const otp = String(randomInt(100000, 1000000));
  pendingOtps.set(clientAddress, {
    email: providedEmail,
    hash: hashOtp(otp),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0
  });
  loginAttempts.delete(clientAddress);

  try {
    await getMailer().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: adminEmail,
      subject: 'Scholara admin verification code',
      text: `Your Scholara admin verification code is ${otp}. It expires in 10 minutes.`
    });
    res.json({ success: true, message: 'Verification code sent to the admin email.' });
  } catch (error) {
    pendingOtps.delete(clientAddress);
    console.error('Error sending admin verification code:', error);
    const message = error?.responseCode === 535
      ? 'SMTP rejected the email credentials. Set SMTP_PASSWORD to a valid Gmail App Password, then restart the server.'
      : 'Could not send the verification code. Check the SMTP settings and try again.';
    res.status(502).json({ success: false, message });
  }
});

router.post('/session/verify-code', async (req, res) => {
  const clientAddress = req.ip || 'unknown';
  const pending = pendingOtps.get(clientAddress);
  const providedCode = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
  if (!pending || pending.expiresAt <= Date.now()) {
    pendingOtps.delete(clientAddress);
    return res.status(401).json({ success: false, message: 'Verification code expired. Request a new code.' });
  }
  if (pending.attempts >= 5) {
    pendingOtps.delete(clientAddress);
    return res.status(429).json({ success: false, message: 'Too many verification attempts. Request a new code.' });
  }
  pending.attempts += 1;
  const expectedBuffer = Buffer.from(pending.hash);
  const providedBuffer = Buffer.from(hashOtp(providedCode));
  const matches = timingSafeEqual(expectedBuffer, providedBuffer);
  if (!matches) {
    return res.status(401).json({ success: false, message: 'Incorrect verification code.' });
  }

  pendingOtps.delete(clientAddress);
  const token = randomBytes(32).toString('base64url');
  if (isMongoConnected) {
    await AdminSession.create({
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS)
    });
  } else {
    sessions.set(token, Date.now() + SESSION_TTL_MS);
  }
  setSessionCookie(res, token, SESSION_TTL_MS / 1000);
  res.json({ success: true, message: 'Admin session started.' });
});

router.get('/session', requireAdminSession, (req, res) => {
  res.json({ success: true });
});

router.delete('/session', (req, res) => {
  const token = getCookieValue(req, SESSION_COOKIE);
  const finish = async () => {
    if (isMongoConnected && token) {
      await AdminSession.deleteOne({ tokenHash: createHash('sha256').update(token).digest('hex') });
    } else {
      sessions.delete(token);
    }
    setSessionCookie(res, '', 0);
    res.json({ success: true });
  };
  finish().catch((error) => {
    console.error('Error ending admin session:', error);
    res.status(500).json({ success: false, message: 'Could not end admin session.' });
  });
});

router.get('/matcher-contacts', requireAdminSession, async (req, res) => {
  try {
    const profiles = await Store.getMatcherContactProfiles(500);
    res.json({ success: true, count: profiles.count, data: profiles.data });
  } catch (error) {
    console.error('Error fetching matcher contacts:', error);
    res.status(500).json({ success: false, message: 'Could not load matcher contacts.' });
  }
});

export default router;