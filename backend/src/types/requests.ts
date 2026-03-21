import { Request } from 'express';
import { Role, MentorshipChannel } from './enums';

// ─── Authenticated User (attached by auth middleware) ───────────────────────

export interface AuthUser {
  uid: string;
  role: Role;
  email: string;
}

// Augment Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Convenience type alias — use in controllers that require auth
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// ─── Request DTOs ───────────────────────────────────────────────────────────

export interface CreatePostBody {
  textContent: string;
  mediaUrl?: string;
}

export interface CreateCommentBody {
  content: string;
}

export interface SendConnectionRequestBody {
  targetUserId: string;
}

export interface RespondConnectionBody {
  status: 'ACCEPTED' | 'REJECTED';
}

export interface CreateMentorshipRequestBody {
  mentorId: string;
  topic: string;
}

export interface RespondMentorshipBody {
  status: 'ACCEPTED' | 'REJECTED';
  channel?: MentorshipChannel;
  scheduledTime?: string;
}

export interface SendMessageBody {
  content: string;
}

export interface RegisterUserBody {
  fullName: string;
  email: string;
  role: Role;
  domain?: string;
  skills?: string[];
  profilePicUrl?: string;
}

export interface BanUserBody {
  reason?: string;
}

export interface SearchMentorsQuery {
  domain?: string;
  limit?: string;
}
