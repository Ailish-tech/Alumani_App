import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import path from 'path';

// Load environment variables first (from project root .env)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { initializeFirebase } from './config/firebase';
import { initializeSocketHandlers } from './socket/socketHandler';
import { AppError } from './utils/errors';
import { sanitizeMiddleware } from './middleware/sanitize';

// Route imports
import authRoutes from './routes/authRoutes';
import postRoutes from './routes/postRoutes';
import connectionRoutes from './routes/connectionRoutes';
import mentorshipRoutes from './routes/mentorshipRoutes';
import chatRoutes from './routes/chatRoutes';
import videoRoutes from './routes/videoRoutes';
import adminRoutes from './routes/adminRoutes';
import eventRoutes from './routes/eventRoutes';
import jobRoutes from './routes/jobRoutes';
import communityRoutes from './routes/communityRoutes';
import featureRoutes from './routes/featureRoutes';
import alumniRoutes from './routes/alumniRoutes';
import mlRoutes from './routes/mlRoutes';
import followRoutes from './routes/followRoutes';
import masterRoutes from './routes/masterRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { checkGraduationStatus } from './middleware/checkGraduationStatus';

// Controller Socket.io injection
import { setIoInstance as setMentorshipIo } from './controllers/mentorshipController';
import { setIoInstance as setPostIo } from './controllers/postController';
import { setIoInstance as setConnectionIo } from './controllers/connectionController';

// ─── Initialize Firebase ────────────────────────────────────────────────────

initializeFirebase();

// ─── Express App ────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

// ─── Socket.io ──────────────────────────────────────────────────────────────

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Inject io into controllers that need real-time notifications
setMentorshipIo(io);
setPostIo(io);
setConnectionIo(io);

// Initialize Socket.io event handlers
initializeSocketHandlers(io);

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({ origin: '*' }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeMiddleware);

// Rate limiting — relaxed in development
const isDev = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
}

// ─── Health Check ───────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AlumniConnect API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Route Mounting ─────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', masterRoutes); // Master list CSV upload routes

// ─── Lazy Graduation Auto-Transition ────────────────────────────────────────
// Runs on all subsequent protected requests; checks if STUDENT → ALUMNI transition is due
app.use('/api/', checkGraduationStatus as any);

// ─── 404 Handler ────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('💥 Error:', err.message);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...('fields' in err && { fields: (err as any).fields }),
    });
    return;
  }

  // Unexpected errors
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
  });
};

app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3000', 10);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║       🎓 AlumniConnect API Server            ║
  ║──────────────────────────────────────────────║
  ║  Port:        ${PORT}                            ║
  ║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
  ║  DynamoDB:    ${(process.env.DYNAMO_ENDPOINT || 'localhost:8000').padEnd(28)}║
  ║  Socket.io:   Enabled                        ║
  ╚══════════════════════════════════════════════╝
  `);
});

export { app, server, io };
