import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import { searchMentors, setUserBanStatus, getUserById } from '../services/userService';
import { deletePost, getGlobalFeed } from '../services/postService';
import * as adminSvc from '../services/adminService';
import { ValidationError } from '../utils/errors';

// ─── Platform Analytics ─────────────────────────────────────────────────────

export async function getPlatformStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const stats = await adminSvc.getPlatformStats();
    res.json({ success: true, data: stats });
  } catch (e) { next(e); }
}

// ─── Top Mentors (existing) ─────────────────────────────────────────────────

export async function getTopMentors(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const mentors = await searchMentors(undefined, limit);
    mentors.sort((a, b) => b.studentsGuided - a.studentsGuided);
    res.json({ success: true, data: mentors });
  } catch (e) { next(e); }
}

// ─── User Management ────────────────────────────────────────────────────────

export async function getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const users = await adminSvc.getAllUsers(parseInt(req.query.limit as string, 10) || 100);
    res.json({ success: true, data: users });
  } catch (e) { next(e); }
}

export async function changeUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params; const { role } = req.body;
    if (!userId || !role) throw new ValidationError('userId and role required');
    if (userId === req.user.uid) throw new ValidationError('Cannot change your own role');
    await adminSvc.changeUserRole(userId, role);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'CHANGE_ROLE', targetType: 'USER', targetId: userId, details: `Changed role to ${role}` });
    res.json({ success: true, message: `Role changed to ${role}` });
  } catch (e) { next(e); }
}

export async function banUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    if (!userId) throw new ValidationError('userId required');
    if (userId === req.user.uid) throw new ValidationError('Cannot ban yourself');
    const user = await getUserById(userId);
    if (user.isBanned) throw new ValidationError('User already banned');
    await setUserBanStatus(userId, true);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'BAN_USER', targetType: 'USER', targetId: userId });
    res.json({ success: true, message: `User ${userId} banned` });
  } catch (e) { next(e); }
}

export async function unbanUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    await setUserBanStatus(userId, false);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'UNBAN_USER', targetType: 'USER', targetId: userId });
    res.json({ success: true, message: `User ${userId} unbanned` });
  } catch (e) { next(e); }
}

// ─── Content Moderation ─────────────────────────────────────────────────────

export async function deletePostHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { postId } = req.params;
    if (!postId) throw new ValidationError('postId required');
    await deletePost(postId);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'DELETE_POST', targetType: 'POST', targetId: postId });
    res.json({ success: true, message: `Post ${postId} deleted` });
  } catch (e) { next(e); }
}

export async function deleteEventHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try { await adminSvc.deleteEvent(req.params.eventId);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'DELETE_EVENT', targetType: 'EVENT', targetId: req.params.eventId });
    res.json({ success: true }); } catch (e) { next(e); }
}

export async function deleteJobHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try { await adminSvc.deleteJob(req.params.jobId);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'DELETE_JOB', targetType: 'JOB', targetId: req.params.jobId });
    res.json({ success: true }); } catch (e) { next(e); }
}

export async function deleteGroupHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try { await adminSvc.deleteGroup(req.params.groupId);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'DELETE_GROUP', targetType: 'GROUP', targetId: req.params.groupId });
    res.json({ success: true }); } catch (e) { next(e); }
}

export async function deleteStoryHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try { await adminSvc.deleteStory(req.params.storyId);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'DELETE_STORY', targetType: 'STORY', targetId: req.params.storyId });
    res.json({ success: true }); } catch (e) { next(e); }
}

export async function getAdminFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const feed = await getGlobalFeed(limit);
    res.json({ success: true, data: feed });
  } catch (e) { next(e); }
}

// ─── Reports ────────────────────────────────────────────────────────────────

export async function getReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminSvc.getReports(req.query.status as string) }); } catch (e) { next(e); }
}

export async function updateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { status, adminNote } = req.body;
    await adminSvc.updateReportStatus(req.params.reportId, status, adminNote);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'REVIEW_REPORT', targetType: 'REPORT', targetId: req.params.reportId, details: status });
    res.json({ success: true });
  } catch (e) { next(e); }
}

export async function createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) throw new ValidationError('targetType, targetId, and reason required');
    const r = await adminSvc.createReport({ reporterId: req.user.uid, targetType, targetId, reason });
    res.status(201).json({ success: true, data: r });
  } catch (e) { next(e); }
}

// ─── Announcements ──────────────────────────────────────────────────────────

export async function getAnnouncements(_r: AuthenticatedRequest, res: Response, next: NextFunction) {
  try { res.json({ success: true, data: await adminSvc.getAnnouncements() }); } catch (e) { next(e); }
}

export async function createAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { title, message, priority, targetRole } = req.body;
    if (!title || !message) throw new ValidationError('Title and message required');
    const a = await adminSvc.createAnnouncement({ adminId: req.user.uid, title, message, priority: priority || 'normal', targetRole });
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'CREATE_ANNOUNCEMENT', targetType: 'ANNOUNCEMENT', targetId: a.id });
    res.status(201).json({ success: true, data: a });
  } catch (e) { next(e); }
}

export async function deleteAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminSvc.deleteAnnouncement(req.params.announcementId);
    await adminSvc.logAdminAction({ adminId: req.user.uid, action: 'DELETE_ANNOUNCEMENT', targetType: 'ANNOUNCEMENT', targetId: req.params.announcementId });
    res.json({ success: true });
  } catch (e) { next(e); }
}

// ─── Audit Log ──────────────────────────────────────────────────────────────

export async function getAuditLog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    res.json({ success: true, data: await adminSvc.getAuditLog(limit) });
  } catch (e) { next(e); }
}
