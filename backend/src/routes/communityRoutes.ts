import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import * as cc from '../controllers/communityController';

const router = Router();
router.use(authMiddleware);

// Groups
router.post('/groups', cc.handleCreateGroup as any);
router.get('/groups', cc.handleGetGroups as any);
router.get('/groups/:groupId', cc.handleGetGroupDetail as any);
router.post('/groups/:groupId/join', cc.handleJoinGroup as any);
router.post('/groups/:groupId/leave', cc.handleLeaveGroup as any);

// Polls
router.post('/polls', cc.handleCreatePoll as any);
router.get('/polls', cc.handleGetPolls as any);
router.post('/polls/:pollId/vote', cc.handleVotePoll as any);

// Q&A
router.post('/qa', cc.handleCreateQuestion as any);
router.get('/qa', cc.handleGetQuestions as any);
router.post('/qa/:questionId/answers', cc.handleAddAnswer as any);
router.get('/qa/:questionId/answers', cc.handleGetAnswers as any);

export default router;
