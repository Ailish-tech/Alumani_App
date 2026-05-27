import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getNotifications, markNotificationRead } from '../controllers/notificationController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

router.get('/', authMiddleware, (req, res, next) =>
  getNotifications(req as AuthenticatedRequest, res, next)
);

router.patch('/:id/read', authMiddleware, (req, res, next) =>
  markNotificationRead(req as AuthenticatedRequest, res, next)
);

export default router;
