import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { Role } from '../types/enums';
import {
  createMentorshipRequestHandler,
  respondMentorshipHandler,
  completeMentorshipHandler,
  getMyMentorships,
  searchMentorsHandler,
} from '../controllers/mentorshipController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

// Search mentors — any authenticated user
router.get('/search-mentors', authMiddleware, (req, res, next) =>
  searchMentorsHandler(req as AuthenticatedRequest, res, next)
);

// Student creates a mentorship request
router.post(
  '/request',
  authMiddleware,
  authorize(Role.STUDENT),
  (req, res, next) =>
    createMentorshipRequestHandler(req as AuthenticatedRequest, res, next)
);

// Mentor responds (accept/reject)
router.put(
  '/:id/respond',
  authMiddleware,
  authorize(Role.ALUMNI, Role.FACULTY),
  (req, res, next) =>
    respondMentorshipHandler(req as AuthenticatedRequest, res, next)
);

// Either participant marks as completed
router.put('/:id/complete', authMiddleware, (req, res, next) =>
  completeMentorshipHandler(req as AuthenticatedRequest, res, next)
);

// Get current user's mentorships
router.get('/my', authMiddleware, (req, res, next) =>
  getMyMentorships(req as AuthenticatedRequest, res, next)
);

export default router;
