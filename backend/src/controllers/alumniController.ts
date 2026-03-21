import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import * as svc from '../services/alumniService';
import { ValidationError } from '../utils/errors';

// ─── Impact Dashboard ───────────────────────────────────────────────────────
export const handleGetImpact = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAlumniImpact(req.user.uid) }); } catch (e) { next(e); }
};

// ─── Referrals ──────────────────────────────────────────────────────────────
export const handleCreateReferral = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId, company, position, note } = req.body;
    if (!studentId || !company || !position) throw new ValidationError('Student, company, and position required');
    const r = await svc.createReferral({ alumniId: req.user.uid, studentId, company, position, note: note || '' });
    res.status(201).json({ success: true, data: r });
  } catch (e) { next(e); }
};
export const handleGetReferrals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAlumniReferrals(req.user.uid) }); } catch (e) { next(e); }
};
export const handleUpdateReferralStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { await svc.updateReferralStatus(req.params.referralId, req.body.status); res.json({ success: true }); } catch (e) { next(e); }
};

// ─── Success Stories ────────────────────────────────────────────────────────
export const handleCreateStory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, content, company, yearGraduated, tags } = req.body;
    if (!title || !content) throw new ValidationError('Title and content required');
    const s = await svc.createStory({ authorId: req.user.uid, title, content, company: company || '', yearGraduated: yearGraduated || '', tags: tags || [] });
    res.status(201).json({ success: true, data: s });
  } catch (e) { next(e); }
};
export const handleGetStories = async (_r: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAllStories() }); } catch (e) { next(e); }
};
export const handleLikeStory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { await svc.likeStory(req.params.storyId); res.json({ success: true }); } catch (e) { next(e); }
};

// ─── Company Directory ──────────────────────────────────────────────────────
export const handleRegisterCompany = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { companyName, role, industry, location, hiringStatus, website } = req.body;
    if (!companyName) throw new ValidationError('Company name required');
    const c = await svc.registerCompany({ alumniId: req.user.uid, companyName, role: role || '', industry: industry || '', location: location || '', hiringStatus: hiringStatus || 'not_hiring', website: website || '' });
    res.status(201).json({ success: true, data: c });
  } catch (e) { next(e); }
};
export const handleGetCompanies = async (_r: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAllCompanies() }); } catch (e) { next(e); }
};
