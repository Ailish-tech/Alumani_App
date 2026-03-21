import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getVideoToken } from '../controllers/videoController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

router.get('/token', authMiddleware, (req, res, next) =>
  getVideoToken(req as AuthenticatedRequest, res, next)
);

export default router;
