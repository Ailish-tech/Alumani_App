import {
  Role,
  ConnectionStatus,
  MentorshipStatus,
  MentorshipChannel,
  NotificationType,
} from './enums';

// ─── DynamoDB Base Item ─────────────────────────────────────────────────────

export interface DynamoBaseItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
}

// ─── User ───────────────────────────────────────────────────────────────────

export interface UserEntity extends DynamoBaseItem {
  entityType: 'USER';
  id: string;
  email: string;
  role: Role;
  fullName: string;
  profilePicUrl: string;
  skills: string[];
  domain: string;
  bio: string;
  workplace: string;
  reputationScore: number;
  studentsGuided: number;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Post ───────────────────────────────────────────────────────────────────

export interface PostEntity extends DynamoBaseItem {
  entityType: 'POST';
  id: string;
  authorId: string;
  textContent: string;
  mediaUrl: string | null;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  commentsDisabled: boolean;
  createdAt: string;
}

// ─── Post Like ──────────────────────────────────────────────────────────────

export interface PostLikeEntity extends DynamoBaseItem {
  entityType: 'POST_LIKE';
  postId: string;
  userId: string;
  createdAt: string;
}

// ─── Post Comment ───────────────────────────────────────────────────────────

export interface PostCommentEntity extends DynamoBaseItem {
  entityType: 'POST_COMMENT';
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;       // null = top-level, string = reply to another comment
  replyToAuthorId: string | null; // who this reply is directed at
  createdAt: string;
}

// ─── Post Bookmark (Saved Posts) ────────────────────────────────────────────

export interface PostBookmarkEntity extends DynamoBaseItem {
  entityType: 'POST_BOOKMARK';
  userId: string;
  postId: string;
  createdAt: string;
}

// ─── Connection ─────────────────────────────────────────────────────────────

export interface ConnectionEntity extends DynamoBaseItem {
  entityType: 'CONNECTION';
  userA: string;
  userB: string;
  status: ConnectionStatus;
  requesterId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Mentorship Request ─────────────────────────────────────────────────────

export interface MentorshipEntity extends DynamoBaseItem {
  entityType: 'MENTORSHIP';
  id: string;
  studentId: string;
  mentorId: string;
  topic: string;
  status: MentorshipStatus;
  channel: MentorshipChannel | null;
  scheduledTime: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Chat Room ──────────────────────────────────────────────────────────────

export interface ChatRoomEntity extends DynamoBaseItem {
  entityType: 'CHAT_ROOM';
  id: string;
  participantOneId: string;
  participantTwoId: string;
  lastMessagePreview: string;
  updatedAt: string;
  createdAt: string;
}

// ─── Message ────────────────────────────────────────────────────────────────

export interface MessageEntity extends DynamoBaseItem {
  entityType: 'MESSAGE';
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

// ─── Notification ───────────────────────────────────────────────────────────

export interface NotificationEntity extends DynamoBaseItem {
  entityType: 'NOTIFICATION';
  id: string;
  userId: string;
  triggeringUserId: string;
  type: NotificationType;
  referenceId: string;  // postId, connectionId, mentorshipId, etc.
  readStatus: boolean;
  createdAt: string;
}

// ─── Union type for all entities ────────────────────────────────────────────

export type AlumniConnectEntity =
  | UserEntity
  | PostEntity
  | PostLikeEntity
  | PostCommentEntity
  | ConnectionEntity
  | MentorshipEntity
  | ChatRoomEntity
  | MessageEntity
  | NotificationEntity;
