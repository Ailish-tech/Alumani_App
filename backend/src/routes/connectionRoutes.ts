import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  sendConnectionRequestHandler,
  respondConnectionHandler,
  getMyConnections,
  searchUsersHandler,
} from '../controllers/connectionController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

// Search users — must be BEFORE /:userId routes
router.get('/search', authMiddleware, (req, res, next) =>
  searchUsersHandler(req as AuthenticatedRequest, res, next)
);

router.post('/request', authMiddleware, (req, res, next) =>
  sendConnectionRequestHandler(req as AuthenticatedRequest, res, next)
);

router.put('/:userId/respond', authMiddleware, (req, res, next) =>
  respondConnectionHandler(req as AuthenticatedRequest, res, next)
);

router.get('/', authMiddleware, (req, res, next) =>
  getMyConnections(req as AuthenticatedRequest, res, next)
);

export default router;
