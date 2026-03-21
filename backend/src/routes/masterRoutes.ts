import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { uploadCSV, uploadMasterList, claimAccountHandler } from '../controllers/masterController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

/**
 * POST /api/admin/upload-master-list
 *
 * Admin-only endpoint. Accepts a CSV file (form field: "file") and
 * batch-inserts records as MASTER#{collegeId} entities.
 *
 * CSV headers are auto-normalized (case-insensitive, alias-mapped).
 */
router.post(
  '/upload-master-list',
  authMiddleware,
  (req, res, next) => {
    // TODO: Add admin role check middleware here
    uploadCSV(req as any, res as any, (err?: any) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  (req, res, next) => uploadMasterList(req as AuthenticatedRequest, res, next)
);

export default router;
