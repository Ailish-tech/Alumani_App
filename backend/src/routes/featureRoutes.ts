import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as fc from '../controllers/featureController';

const router = Router();
router.use(authMiddleware);

// Endorsements
router.post('/endorsements', fc.handleEndorse as any);
router.get('/endorsements/:userId', fc.handleGetEndorsements as any);

// Goals
router.post('/goals', fc.handleCreateGoal as any);
router.get('/goals', fc.handleGetGoals as any);
router.patch('/goals/:goalId', fc.handleUpdateGoalStatus as any);

// Career
router.get('/career/stats', fc.handleGetCareerStats as any);

// Badges
router.get('/badges/definitions', fc.handleGetBadgeDefs as any);
router.get('/badges/:userId', fc.handleGetUserBadges as any);
router.get('/badges', fc.handleGetUserBadges as any);

// Booking (Office Hours)
router.post('/booking/slots', fc.handleCreateSlot as any);
router.get('/booking/slots/:mentorId', fc.handleGetSlots as any);
router.post('/booking/slots/:mentorId/book', fc.handleBookSlot as any);

// Resources
router.post('/resources', fc.handleCreateResource as any);
router.get('/resources', fc.handleGetResources as any);

export default router;
