// ─── Shared types mirroring backend ─────────────────────────────────────────

export enum Role {
  STUDENT = 'STUDENT',
  ALUMNI = 'ALUMNI',
  FACULTY = 'FACULTY',
  ADMIN = 'ADMIN',
}

export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum MentorshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export enum MentorshipChannel {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
}

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECT_ACCEPT = 'CONNECT_ACCEPT',
  MENTOR_REQUEST = 'MENTOR_REQUEST',
  MENTOR_ACCEPT = 'MENTOR_ACCEPT',
  MENTOR_REJECT = 'MENTOR_REJECT',
  MENTOR_COMPLETE = 'MENTOR_COMPLETE',
  MESSAGE = 'MESSAGE',
}

export interface User {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  profilePicUrl: string;
  skills: string[];
  domain: string;
  bio?: string;
  workplace?: string;
  reputationScore: number;
  studentsGuided: number;
  isBanned: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  textContent: string;
  mediaUrl: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  authorName?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Connection {
  userA: string;
  userB: string;
  status: ConnectionStatus;
  requesterId: string;
  createdAt: string;
}

export interface MentorshipRequest {
  id: string;
  studentId: string;
  mentorId: string;
  topic: string;
  status: MentorshipStatus;
  channel: MentorshipChannel | null;
  scheduledTime: string | null;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  lastMessagePreview: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  triggeringUserId: string;
  type: NotificationType;
  referenceId: string;
  readStatus: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: { nextCursor: string | null };
}

export interface VideoTokenResponse {
  appId: string;
  token: string;
  channelName: string;
  uid: number;
  encryption: {
    mode: string;
    key: string;
    salt: string;
  };
}
