import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, isMongoConnected } from './config/db.js';
import opportunitiesRouter from './routes/opportunities.js';
import uploadRouter from './routes/upload.js';
import bannerRouter from './routes/banner.js';
import matcherRouter from './routes/matcher.js';
import adminRouter from './routes/admin.js';
import opportunityAgentRouter from './routes/opportunityAgent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({
  path: path.join(process.env.SCHOLARA_CONFIG_DIR || path.join(os.homedir(), '.scholara'), 'server.env')
});

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);
app.use(helmet());

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/banner', bannerRouter);
app.use('/api/matcher', matcherRouter);
app.use('/api/admin', adminRouter);
app.use('/api/opportunity-agent', opportunityAgentRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: isMongoConnected ? 'MongoDB Live' : 'Resilient File Store',
    mongoConnected: isMongoConnected
  });
});

// Serve frontend in production if built
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Scholarship Portal API is running.');
    }
  });
});

// Start Server
const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`🚀 [Server] Scholarship & Internship Portal Server running on http://localhost:${PORT}`);
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use. The backend may already be running at http://localhost:${PORT}.`);
      process.exitCode = 1;
      return;
    }
    console.error('[Server] Could not start HTTP server:', error);
    process.exitCode = 1;
  });
};

startServer();
