import { Router } from 'express';
import { authMiddleware, firebaseOnlyAuth } from '../middleware/authMiddleware';
import { registerUser, getMe, getUserProfile, updateMe, getUploadUrl } from '../controllers/authController';
import { claimAccountHandler } from '../controllers/masterController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

router.post('/register', authMiddleware, (req, res, next) =>
  registerUser(req as AuthenticatedRequest, res, next)
);

router.get('/me', authMiddleware, (req, res, next) =>
  getMe(req as AuthenticatedRequest, res, next)
);

// Update current user's profile (fullName, domain, skills, profilePicUrl)
router.patch('/me', authMiddleware, (req, res, next) =>
  updateMe(req as AuthenticatedRequest, res, next)
);

// Get S3 pre-signed upload URL for profile picture
router.get('/upload-url', authMiddleware, (req, res, next) =>
  getUploadUrl(req as AuthenticatedRequest, res, next)
);

router.get('/user/:userId', authMiddleware, (req, res, next) =>
  getUserProfile(req as AuthenticatedRequest, res, next)
);

// ── Account Claiming (Master List) ──────────────────────────────────────
router.post('/claim', firebaseOnlyAuth, (req, res, next) =>
  claimAccountHandler(req as AuthenticatedRequest, res, next)
);

export default router;

