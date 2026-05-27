import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  handleCreateJob, handleGetJobs, handleGetJobDetail,
  handleApplyToJob, handleGetJobApplicants, handleDeleteJob,
} from '../controllers/jobController';

const router = Router();
router.use(authMiddleware);

router.post('/', handleCreateJob as any);
router.get('/', handleGetJobs as any);
router.get('/:jobId', handleGetJobDetail as any);
router.post('/:jobId/apply', handleApplyToJob as any);
router.get('/:jobId/applicants', handleGetJobApplicants as any);
router.delete('/:jobId', handleDeleteJob as any);

export default router;
