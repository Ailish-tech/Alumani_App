import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { authorize } from '../middleware/rbacMiddleware';
import { Role } from '../types/enums';
import {
  getPlatformStats, getTopMentors, getAllUsers, changeUserRole,
  banUser, unbanUser, deletePostHandler, deleteEventHandler,
  deleteJobHandler, deleteGroupHandler, deleteStoryHandler,
  getAdminFeed, getReports, updateReport, createReport,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  getAuditLog,
} from '../controllers/adminController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

// All admin routes require auth + ADMIN role
router.use(authMiddleware, authorize(Role.ADMIN));

const wrap = (fn: Function) => (req: any, res: any, next: any) => fn(req as AuthenticatedRequest, res, next);

// ─── Platform Analytics ─────────────────────────────────────────────────────
router.get('/stats', wrap(getPlatformStats));
router.get('/top-mentors', wrap(getTopMentors));

// ─── User Management ────────────────────────────────────────────────────────
router.get('/users', wrap(getAllUsers));
router.put('/users/:userId/role', wrap(changeUserRole));
router.put('/ban/:userId', wrap(banUser));
router.put('/unban/:userId', wrap(unbanUser));

// ─── Content Moderation ─────────────────────────────────────────────────────
router.get('/feed', wrap(getAdminFeed));
router.delete('/post/:postId', wrap(deletePostHandler));
router.delete('/event/:eventId', wrap(deleteEventHandler));
router.delete('/job/:jobId', wrap(deleteJobHandler));
router.delete('/group/:groupId', wrap(deleteGroupHandler));
router.delete('/story/:storyId', wrap(deleteStoryHandler));

// ─── Reports ────────────────────────────────────────────────────────────────
router.get('/reports', wrap(getReports));
router.post('/reports', wrap(createReport));
router.patch('/reports/:reportId', wrap(updateReport));

// ─── Announcements ──────────────────────────────────────────────────────────
router.get('/announcements', wrap(getAnnouncements));
router.post('/announcements', wrap(createAnnouncement));
router.delete('/announcements/:announcementId', wrap(deleteAnnouncement));

// ─── Audit Log ──────────────────────────────────────────────────────────────
router.get('/audit-log', wrap(getAuditLog));

export default router;
