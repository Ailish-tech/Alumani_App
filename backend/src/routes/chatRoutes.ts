import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getChatRooms, getChatMessages } from '../controllers/chatController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

router.get('/rooms', authMiddleware, (req, res, next) =>
  getChatRooms(req as AuthenticatedRequest, res, next)
);

router.get('/rooms/:roomId/messages', authMiddleware, (req, res, next) =>
  getChatMessages(req as AuthenticatedRequest, res, next)
);

export default router;
