import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import authorize from '../middleware/rbacMiddleware';
import { Role } from '../types/enums';
import * as mlCtrl from '../controllers/mlController';

const router = Router();

// All ML routes require authentication
router.use(authMiddleware);

// ─── Student & All-User ML Endpoints ────────────────────────────────────────
router.get('/mentor-match', mlCtrl.getSmartMentorMatch);
router.get('/personalized-feed', mlCtrl.getPersonalizedFeed);
router.get('/skill-gap', mlCtrl.getSkillGapAnalysis);
router.get('/career-path', mlCtrl.getCareerPathPredict);
router.get('/job-match', mlCtrl.getSmartJobMatch);
router.get('/similar-profiles', mlCtrl.getSimilarProfiles);
router.get('/trending-topics', mlCtrl.getTrendingTopics);
router.get('/event-recommendations', mlCtrl.getSmartEventRecs);

// ─── Admin-Only ML Endpoints ────────────────────────────────────────────────
router.get('/sentiment', authorize(Role.ADMIN), mlCtrl.getSentimentAnalysis);
router.get('/engagement', authorize(Role.ADMIN), mlCtrl.getEngagementScores);

export default router;
