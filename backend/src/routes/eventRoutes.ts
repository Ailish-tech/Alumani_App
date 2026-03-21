import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  handleCreateEvent, handleGetEvents, handleGetEventDetail,
  handleRsvpEvent, handleGetEventRSVPs, handleDeleteEvent,
} from '../controllers/eventController';

const router = Router();
router.use(authMiddleware);

router.post('/', handleCreateEvent as any);
router.get('/', handleGetEvents as any);
router.get('/:eventId', handleGetEventDetail as any);
router.post('/:eventId/rsvp', handleRsvpEvent as any);
router.get('/:eventId/rsvps', handleGetEventRSVPs as any);
router.delete('/:eventId', handleDeleteEvent as any);

export default router;
