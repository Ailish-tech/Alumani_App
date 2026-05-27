import { PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';

// ─── Platform Analytics ─────────────────────────────────────────────────────
// Queries COLLECTION# partitions via GSI1 (SELECT COUNT) and ROLE# partitions.

export async function getPlatformStats() {
  // Entity type → COLLECTION# partition key
  const partitions: Record<string, string> = {
    JOB: 'COLLECTION#JOBS', EVENT: 'COLLECTION#EVENTS', RESOURCE: 'COLLECTION#RESOURCES',
    GROUP: 'COLLECTION#GROUPS', POLL: 'COLLECTION#POLLS', QUESTION: 'COLLECTION#QUESTIONS',
    SUCCESS_STORY: 'COLLECTION#STORIES', COMPANY: 'COLLECTION#COMPANIES',
  };

  const counts: Record<string, number> = {};
  for (const [type, gsi1pk] of Object.entries(partitions)) {
    const r = await dynamoDb.send(new QueryCommand({
      TableName: TABLE_NAME, IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': gsi1pk },
      Select: 'COUNT',
    }));
    counts[type] = r.Count || 0;
  }

  // Posts via GSI2 GLOBAL#FEED
  const postsR = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :pk',
    ExpressionAttributeValues: { ':pk': 'GLOBAL#FEED' },
    Select: 'COUNT',
  }));
  counts['POST'] = postsR.Count || 0;

  // Users by role — query each ROLE# partition via GSI1
  const roleBreakdown: Record<string, number> = {};
  let totalUsers = 0;
  for (const role of ['STUDENT', 'ALUMNI', 'ADMIN', 'FACULTY']) {
    const r = await dynamoDb.send(new QueryCommand({
      TableName: TABLE_NAME, IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': buildKey('ROLE', role) },
      Select: 'COUNT',
    }));
    const cnt = r.Count || 0;
    if (cnt > 0) roleBreakdown[role] = cnt;
    totalUsers += cnt;
  }
  counts['USER'] = totalUsers;

  // Banned users — query role partitions with filter
  let bannedCount = 0;
  for (const role of ['STUDENT', 'ALUMNI', 'ADMIN', 'FACULTY']) {
    const r = await dynamoDb.send(new QueryCommand({
      TableName: TABLE_NAME, IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      FilterExpression: 'isBanned = :b',
      ExpressionAttributeValues: { ':pk': buildKey('ROLE', role), ':b': true },
      Select: 'COUNT',
    }));
    bannedCount += r.Count || 0;
  }

  return { counts, roleBreakdown, bannedUsers: bannedCount, totalUsers };
}

// ─── User Role Management ───────────────────────────────────────────────────

export async function changeUserRole(userId: string, newRole: string) {
  await dynamoDb.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: buildKey('USER', userId), SK: 'PROFILE' },
    UpdateExpression: 'SET #r = :r, GSI1PK = :gsi1pk, GSI1SK = :gsi1sk, updatedAt = :u',
    ExpressionAttributeNames: { '#r': 'role' },
    ExpressionAttributeValues: {
      ':r': newRole,
      ':gsi1pk': buildKey('ROLE', newRole),
      ':gsi1sk': buildKey('SCORE', '0'),
      ':u': isoNow(),
    },
  }));
}

export async function getAllUsers(limit = 100) {
  const allUsers: any[] = [];
  for (const role of ['STUDENT', 'ALUMNI', 'ADMIN', 'FACULTY']) {
    const r = await dynamoDb.send(new QueryCommand({
      TableName: TABLE_NAME, IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': buildKey('ROLE', role) },
      Limit: limit,
    }));
    allUsers.push(...(r.Items || []));
  }
  return allUsers.slice(0, limit);
}

// ─── Reports ────────────────────────────────────────────────────────────────
// GSI1: COLLECTION#REPORTS / DATE#<createdAt>

export async function createReport(params: {
  reporterId: string; targetType: string; targetId: string; reason: string;
}) {
  const id = generateId(); const now = isoNow();
  const item = {
    PK: buildKey('REPORT', id), SK: 'META',
    GSI1PK: 'COLLECTION#REPORTS', GSI1SK: buildKey('DATE', now),
    entityType: 'REPORT', id, ...params,
    status: 'pending',
    createdAt: now,
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getReports(status?: string) {
  const r = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#REPORTS' },
    ScanIndexForward: false,
  }));
  const items = r.Items || [];
  return status ? items.filter((i: any) => i.status === status) : items;
}

export async function updateReportStatus(reportId: string, status: string, adminNote?: string) {
  await dynamoDb.send(new UpdateCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('REPORT', reportId), SK: 'META' },
    UpdateExpression: 'SET #s = :s, adminNote = :n, reviewedAt = :u',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': status, ':n': adminNote || '', ':u': isoNow() },
  }));
}

// ─── Announcements ──────────────────────────────────────────────────────────
// GSI1: COLLECTION#ANNOUNCEMENTS / DATE#<createdAt>

export async function createAnnouncement(params: {
  adminId: string; title: string; message: string; priority: string; targetRole?: string;
}) {
  const id = generateId(); const now = isoNow();
  const item = {
    PK: buildKey('ANNOUNCEMENT', id), SK: 'META',
    GSI1PK: 'COLLECTION#ANNOUNCEMENTS', GSI1SK: buildKey('DATE', now),
    entityType: 'ANNOUNCEMENT', id, ...params,
    isActive: true, createdAt: now,
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getAnnouncements() {
  const r = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#ANNOUNCEMENTS' },
    ScanIndexForward: false,
  }));
  return r.Items || [];
}

export async function deleteAnnouncement(announcementId: string) {
  await dynamoDb.send(new DeleteCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('ANNOUNCEMENT', announcementId), SK: 'META' },
  }));
}

// ─── Audit Log ──────────────────────────────────────────────────────────────
// GSI1: COLLECTION#AUDIT_LOG / DATE#<timestamp>

export async function logAdminAction(params: {
  adminId: string; action: string; targetType: string; targetId: string; details?: string;
}) {
  const id = generateId(); const now = isoNow();
  const item = {
    PK: buildKey('AUDIT', id), SK: 'META',
    GSI1PK: 'COLLECTION#AUDIT_LOG', GSI1SK: buildKey('DATE', now),
    entityType: 'AUDIT', id, ...params,
    timestamp: now,
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
}

export async function getAuditLog(limit = 50) {
  const r = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#AUDIT_LOG' },
    ScanIndexForward: false, Limit: limit,
  }));
  return r.Items || [];
}

// ─── Delete Any Content ─────────────────────────────────────────────────────

export async function deleteEntity(pk: string, sk: string) {
  await dynamoDb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: pk, SK: sk } }));
}

export async function deleteEvent(eventId: string) {
  await deleteEntity(buildKey('EVENT', eventId), 'META');
}

export async function deleteJob(jobId: string) {
  await deleteEntity(buildKey('JOB', jobId), 'META');
}

export async function deleteGroup(groupId: string) {
  await deleteEntity(buildKey('GROUP', groupId), 'META');
}

export async function deleteStory(storyId: string) {
  await deleteEntity(buildKey('STORY', storyId), 'META');
}
