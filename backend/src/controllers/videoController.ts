import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import { getMentorshipById } from '../services/mentorshipService';
import { generateAgoraRtcToken, getAgoraAppId, getEncryptionConfig } from '../services/videoService';
import { ForbiddenError, ValidationError } from '../utils/errors';
import { MentorshipStatus, MentorshipChannel } from '../types/enums';

/**
 * GET /api/video/token?mentorshipId=...
 * Generate an Agora RTC token for a mentorship video call.
 * Channel name = mentorshipId. Both participants get the same encryption config.
 */
export async function getVideoToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const mentorshipId = req.query.mentorshipId as string;

    if (!mentorshipId) {
      throw new ValidationError('mentorshipId query parameter is required');
    }

    const mentorship = await getMentorshipById(mentorshipId);

    // Verify the user is a participant
    if (mentorship.studentId !== req.user.uid && mentorship.mentorId !== req.user.uid) {
      throw new ForbiddenError('You are not a participant of this mentorship');
    }

    // Verify the mentorship is accepted and the channel is VIDEO
    if (mentorship.status !== MentorshipStatus.ACCEPTED) {
      throw new ValidationError('Mentorship must be ACCEPTED to start a video call');
    }

    if (mentorship.channel !== MentorshipChannel.VIDEO) {
      throw new ValidationError('This mentorship is not configured for video calls');
    }

    // Use mentorshipId as the Agora channel name
    const channelName = mentorshipId;
    const uid = 0; // auto-assign
    const token = generateAgoraRtcToken(channelName, uid);
    const encryption = getEncryptionConfig(channelName);

    res.json({
      success: true,
      data: {
        appId: getAgoraAppId(),
        token,
        channelName,
        uid,
        encryption: {
          mode: encryption.encryptionMode,
          key: encryption.encryptionKey,
          salt: encryption.encryptionSalt.toString('base64'),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
