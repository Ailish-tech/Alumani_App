// ─── Role & Status Enums ────────────────────────────────────────────────────

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
