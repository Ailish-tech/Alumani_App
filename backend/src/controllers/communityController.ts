import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import * as svc from '../services/communityService';
import { ValidationError } from '../utils/errors';

// ─── Groups ─────────────────────────────────────────────────────────────────
export const handleCreateGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const { name, description, category } = req.body; if (!name) throw new ValidationError('Name required'); const g = await svc.createGroup({ name, description, category, createdBy: req.user.uid }); res.status(201).json({ success: true, data: g }); } catch (e) { next(e); }
};
export const handleGetGroups = async (_r: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAllGroups() }); } catch (e) { next(e); }
};
export const handleGetGroupDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const g = await svc.getGroupById(req.params.groupId); if (!g) { res.status(404).json({ success: false, error: 'Not found' }); return; } res.json({ success: true, data: g }); } catch (e) { next(e); }
};
export const handleJoinGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { await svc.joinGroup(req.params.groupId, req.user.uid); res.json({ success: true }); } catch (e) { next(e); }
};
export const handleLeaveGroup = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { await svc.leaveGroup(req.params.groupId, req.user.uid); res.json({ success: true }); } catch (e) { next(e); }
};

// ─── Polls ──────────────────────────────────────────────────────────────────
export const handleCreatePoll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const { question, options } = req.body; if (!question || !options?.length) throw new ValidationError('Question and options required'); const p = await svc.createPoll({ question, options, createdBy: req.user.uid }); res.status(201).json({ success: true, data: p }); } catch (e) { next(e); }
};
export const handleGetPolls = async (_r: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAllPolls() }); } catch (e) { next(e); }
};
export const handleVotePoll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { await svc.votePoll(req.params.pollId, req.user.uid, req.body.optionIndex); res.json({ success: true }); } catch (e) { next(e); }
};

// ─── Q&A ────────────────────────────────────────────────────────────────────
export const handleCreateQuestion = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const { question, isAnonymous } = req.body; if (!question) throw new ValidationError('Question required'); const q = await svc.createQuestion({ question, isAnonymous: !!isAnonymous, createdBy: req.user.uid }); res.status(201).json({ success: true, data: q }); } catch (e) { next(e); }
};
export const handleGetQuestions = async (_r: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAllQuestions() }); } catch (e) { next(e); }
};
export const handleAddAnswer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const { content } = req.body; if (!content) throw new ValidationError('Content required'); await svc.addAnswer(req.params.questionId, { content, authorId: req.user.uid }); res.json({ success: true }); } catch (e) { next(e); }
};
export const handleGetAnswers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAnswers(req.params.questionId) }); } catch (e) { next(e); }
};
