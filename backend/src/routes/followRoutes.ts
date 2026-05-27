import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  followUserHandler,
  unfollowUserHandler,
  getFollowStatusHandler,
  getFollowCountsHandler,
  getFollowersHandler,
  getFollowingHandler,
} from '../controllers/followController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

// Follow a user
router.post('/:userId', authMiddleware, (req, res, next) =>
  followUserHandler(req as AuthenticatedRequest, res, next)
);

// Unfollow a user
router.delete('/:userId', authMiddleware, (req, res, next) =>
  unfollowUserHandler(req as AuthenticatedRequest, res, next)
);

// Check follow status
router.get('/:userId/status', authMiddleware, (req, res, next) =>
  getFollowStatusHandler(req as AuthenticatedRequest, res, next)
);

// Get follower/following counts
router.get('/:userId/counts', authMiddleware, (req, res, next) =>
  getFollowCountsHandler(req as AuthenticatedRequest, res, next)
);

// Get followers list
router.get('/:userId/followers', authMiddleware, (req, res, next) =>
  getFollowersHandler(req as AuthenticatedRequest, res, next)
);

// Get following list
router.get('/:userId/following', authMiddleware, (req, res, next) =>
  getFollowingHandler(req as AuthenticatedRequest, res, next)
);

export default router;
