import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import * as jobService from '../services/jobService';
import { ValidationError } from '../utils/errors';

// ─── Create Job ────────────────────────────────────────────────────────────────

export const handleCreateJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, company, type, description, location, applyUrl, salary } = req.body;
    if (!title || !company) throw new ValidationError('Title and company are required');
    const job = await jobService.createJob({
      title, company, type, description, location, applyUrl, salary, postedBy: req.user.uid,
    });
    res.status(201).json({ success: true, data: job });
  } catch (err) { next(err); }
};

// ─── Get All Jobs ──────────────────────────────────────────────────────────────

export const handleGetJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const typeFilter = req.query.type as string | undefined;
    const jobs = await jobService.getAllJobs(typeFilter);
    res.json({ success: true, data: jobs });
  } catch (err) { next(err); }
};

// ─── Get Job Detail ────────────────────────────────────────────────────────────

export const handleGetJobDetail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const job = await jobService.getJobById(req.params.jobId);
    if (!job) { res.status(404).json({ success: false, error: 'Job not found' }); return; }
    res.json({ success: true, data: job });
  } catch (err) { next(err); }
};

// ─── Apply to Job ──────────────────────────────────────────────────────────────

export const handleApplyToJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const application = await jobService.applyToJob(req.params.jobId, req.user.uid, req.body.coverNote);
    res.json({ success: true, data: application });
  } catch (err) { next(err); }
};

// ─── Get Applicants ────────────────────────────────────────────────────────────

export const handleGetJobApplicants = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const applicants = await jobService.getJobApplicants(req.params.jobId);
    res.json({ success: true, data: applicants });
  } catch (err) { next(err); }
};

// ─── Delete Job ────────────────────────────────────────────────────────────────

export const handleDeleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await jobService.deleteJob(req.params.jobId);
    res.json({ success: true, data: { deleted: req.params.jobId } });
  } catch (err) { next(err); }
};
