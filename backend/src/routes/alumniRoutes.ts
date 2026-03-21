import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as ac from '../controllers/alumniController';

const router = Router();
router.use(authMiddleware);

// Impact Dashboard
router.get('/impact', ac.handleGetImpact as any);

// Referrals
router.post('/referrals', ac.handleCreateReferral as any);
router.get('/referrals', ac.handleGetReferrals as any);
router.patch('/referrals/:referralId', ac.handleUpdateReferralStatus as any);

// Success Stories
router.post('/stories', ac.handleCreateStory as any);
router.get('/stories', ac.handleGetStories as any);
router.post('/stories/:storyId/like', ac.handleLikeStory as any);

// Company Directory
router.post('/companies', ac.handleRegisterCompany as any);
router.get('/companies', ac.handleGetCompanies as any);

export default router;
