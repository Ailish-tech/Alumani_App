import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import * as svc from '../services/featureService';
import { ValidationError } from '../utils/errors';

// ─── Endorsements ───────────────────────────────────────────────────────────
export const handleEndorse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const { userId, skill } = req.body; await svc.endorseSkill(userId, skill, req.user.uid); res.json({ success: true }); } catch (e) { next(e); }
};
export const handleGetEndorsements = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getEndorsements(req.params.userId) }); } catch (e) { next(e); }
};

// ─── Goals ──────────────────────────────────────────────────────────────────
export const handleCreateGoal = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const { title, description, targetDate } = req.body; if (!title) throw new ValidationError('Title required'); const g = await svc.createGoal(req.user.uid, { title, description, targetDate }); res.status(201).json({ success: true, data: g }); } catch (e) { next(e); }
};
export const handleGetGoals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getUserGoals(req.user.uid) }); } catch (e) { next(e); }
};
export const handleUpdateGoalStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { await svc.updateGoalStatus(req.user.uid, req.params.goalId, req.body.status); res.json({ success: true }); } catch (e) { next(e); }
};

// ─── Career Explorer ────────────────────────────────────────────────────────
export const handleGetCareerStats = async (_r: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getCareerStats() }); } catch (e) { next(e); }
};

// ─── Badges ─────────────────────────────────────────────────────────────────
export const handleGetBadgeDefs = async (_r: AuthenticatedRequest, res: Response, _n: NextFunction) => {
  res.json({ success: true, data: svc.getBadgeDefinitions() });
};
export const handleGetUserBadges = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getUserBadges(req.params.userId || req.user.uid) }); } catch (e) { next(e); }
};

// ─── Booking ────────────────────────────────────────────────────────────────
export const handleCreateSlot = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const { dateTime, duration } = req.body; const s = await svc.createSlot(req.user.uid, { dateTime, duration: duration || 30 }); res.status(201).json({ success: true, data: s }); } catch (e) { next(e); }
};
export const handleGetSlots = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getMentorSlots(req.params.mentorId) }); } catch (e) { next(e); }
};
export const handleBookSlot = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { await svc.bookSlot(req.params.mentorId, req.body.dateTime, req.user.uid); res.json({ success: true }); } catch (e) { next(e); }
};

// ─── Resources ──────────────────────────────────────────────────────────────
export const handleCreateResource = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { const { title, description, fileUrl, subject } = req.body; if (!title) throw new ValidationError('Title required'); const r = await svc.createResource({ title, description, fileUrl, subject, uploadedBy: req.user.uid }); res.status(201).json({ success: true, data: r }); } catch (e) { next(e); }
};
export const handleGetResources = async (_r: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAllResources() }); } catch (e) { next(e); }
};
