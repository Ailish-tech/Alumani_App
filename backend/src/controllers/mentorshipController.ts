import { Response, NextFunction } from 'express';
import {
  AuthenticatedRequest,
  CreateMentorshipRequestBody,
  RespondMentorshipBody,
} from '../types/requests';
import { Role, MentorshipStatus, MentorshipChannel, NotificationType } from '../types/enums';
import {
  createMentorshipRequest,
  getMentorshipById,
  respondToMentorship,
  completeMentorship,
  getMentorshipsForStudent,
  getMentorshipsForMentor,
} from '../services/mentorshipService';
import { getOrCreateChatRoom } from '../services/chatService';
import { getUserById, incrementMentorStats, searchMentors } from '../services/userService';
import { createNotification } from '../services/notificationService';
import { ValidationError, ForbiddenError } from '../utils/errors';

// Socket.io instance — injected at server bootstrap
let ioInstance: any = null;
export function setIoInstance(io: any): void {
  ioInstance = io;
}

/**
 * POST /api/mentorship/request
 * Student sends a mentorship request to an Alumni/Faculty mentor.
 */
export async function createMentorshipRequestHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { mentorId, topic } = req.body as CreateMentorshipRequestBody;

    if (!mentorId || !topic) {
      throw new ValidationError('mentorId and topic are required');
    }

    // Validate mentor exists and is ALUMNI or FACULTY
    const mentor = await getUserById(mentorId);
    if (mentor.role !== Role.ALUMNI && mentor.role !== Role.FACULTY) {
      throw new ValidationError('Selected user is not a mentor (must be ALUMNI or FACULTY)');
    }

    const mentorship = await createMentorshipRequest({
      studentId: req.user.uid,
      mentorId,
      topic,
    });

    // Create notification for the mentor
    const notification = await createNotification({
      userId: mentorId,
      triggeringUserId: req.user.uid,
      type: NotificationType.MENTOR_REQUEST,
      referenceId: mentorship.id,
    });

    // Push real-time notification via Socket.io
    if (ioInstance) {
      ioInstance.to(`user:${mentorId}`).emit('notification:new', notification);
    }

    res.status(201).json({ success: true, data: mentorship });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/mentorship/:id/respond
 * Mentor accepts or rejects a mentorship request.
 * On ACCEPT: sets channel/time, creates chat room if TEXT, sends notification.
 */
export async function respondMentorshipHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { status, channel, scheduledTime } = req.body as RespondMentorshipBody;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      throw new ValidationError('status must be ACCEPTED or REJECTED');
    }

    // Verify the current user is the mentor
    const existing = await getMentorshipById(id);
    if (existing.mentorId !== req.user.uid) {
      throw new ForbiddenError('Only the assigned mentor can respond to this request');
    }

    const updated = await respondToMentorship({
      mentorshipId: id,
      status: status as MentorshipStatus.ACCEPTED | MentorshipStatus.REJECTED,
      channel: channel as MentorshipChannel | undefined,
      scheduledTime,
    });

    // If ACCEPTED with TEXT channel → create/get a dedicated chat room
    let chatRoom = null;
    if (status === 'ACCEPTED' && channel === MentorshipChannel.TEXT) {
      chatRoom = await getOrCreateChatRoom(existing.studentId, existing.mentorId);
    }

    // Notify the student
    const notifType =
      status === 'ACCEPTED'
        ? NotificationType.MENTOR_ACCEPT
        : NotificationType.MENTOR_REJECT;

    const notification = await createNotification({
      userId: existing.studentId,
      triggeringUserId: req.user.uid,
      type: notifType,
      referenceId: id,
    });

    if (ioInstance) {
      ioInstance.to(`user:${existing.studentId}`).emit('notification:new', notification);
    }

    res.json({
      success: true,
      data: {
        mentorship: updated,
        chatRoom,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/mentorship/:id/complete
 * Marks a mentorship as COMPLETED and increments the mentor's stats.
 */
export async function completeMentorshipHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await getMentorshipById(id);

    // Either student or mentor can mark as complete
    if (existing.studentId !== req.user.uid && existing.mentorId !== req.user.uid) {
      throw new ForbiddenError('Only participants can complete this mentorship');
    }

    const updated = await completeMentorship(id);

    // Increment mentor stats (studentsGuided + reputationScore by 1)
    await incrementMentorStats(existing.mentorId);

    // Notify both participants
    const otherUserId =
      req.user.uid === existing.studentId ? existing.mentorId : existing.studentId;

    const notification = await createNotification({
      userId: otherUserId,
      triggeringUserId: req.user.uid,
      type: NotificationType.MENTOR_COMPLETE,
      referenceId: id,
    });

    if (ioInstance) {
      ioInstance.to(`user:${otherUserId}`).emit('notification:new', notification);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/mentorship/my
 * Get all mentorship requests for the current user.
 */
export async function getMyMentorships(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentMentorships = await getMentorshipsForStudent(req.user.uid);
    const mentorMentorships = await getMentorshipsForMentor(req.user.uid);

    res.json({
      success: true,
      data: {
        asStudent: studentMentorships,
        asMentor: mentorMentorships,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/mentorship/search-mentors?domain=...&limit=...
 * Search mentors by domain, sorted by reputation.
 */
export async function searchMentorsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const domain = req.query.domain as string | undefined;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const mentors = await searchMentors(domain, limit);

    res.json({ success: true, data: mentors });
  } catch (error) {
    next(error);
  }
}
