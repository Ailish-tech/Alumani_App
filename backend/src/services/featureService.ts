import { PutCommand, GetCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';

// ─── Endorsements ───────────────────────────────────────────────────────────
// PK+SK only — no GSI needed

export async function endorseSkill(userId: string, skill: string, endorserId: string) {
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: buildKey('USER', userId), SK: `ENDORSE#${skill}#${endorserId}`, entityType: 'ENDORSEMENT', userId, skill, endorserId, endorsedAt: isoNow() } }));
}

export async function getEndorsements(userId: string) {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'ENDORSE#' } }));
  const map: Record<string, number> = {};
  (r.Items || []).forEach((i: any) => { map[i.skill] = (map[i.skill] || 0) + 1; });
  return map;
}

// ─── Goals ──────────────────────────────────────────────────────────────────
// PK+SK only — nested under user

export async function createGoal(userId: string, params: { title: string; description: string; targetDate?: string }) {
  const id = generateId();
  const item = { PK: buildKey('USER', userId), SK: `GOAL#${id}`, entityType: 'GOAL', id, ...params, status: 'in_progress', milestones: [], createdAt: isoNow() };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserGoals(userId: string) {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'GOAL#' } }));
  return r.Items || [];
}

export async function updateGoalStatus(userId: string, goalId: string, status: string) {
  await dynamoDb.send(new UpdateCommand({ TableName: TABLE_NAME, Key: { PK: buildKey('USER', userId), SK: `GOAL#${goalId}` }, UpdateExpression: 'SET #s = :s', ExpressionAttributeNames: { '#s': 'status' }, ExpressionAttributeValues: { ':s': status } }));
}

// ─── Career Explorer ────────────────────────────────────────────────────────
// Queries ROLE#ALUMNI via GSI1

export async function getCareerStats() {
  const r = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': buildKey('ROLE', 'ALUMNI') },
  }));
  const domains: Record<string, number> = {};
  (r.Items || []).forEach((u: any) => { if (u.domain) domains[u.domain] = (domains[u.domain] || 0) + 1; });
  return { totalAlumni: (r.Items || []).length, domains };
}

// ─── Badges ─────────────────────────────────────────────────────────────────
// PK+SK only — nested under user

const BADGE_DEFS = [
  { id: 'first_post', name: 'First Post', icon: '📝', description: 'Created your first post' },
  { id: 'networker', name: 'Networker', icon: '🤝', description: '10+ connections' },
  { id: 'mentor_mvp', name: 'Mentor MVP', icon: '🏆', description: 'Guided 5+ students' },
  { id: 'poll_creator', name: 'Poll Creator', icon: '🗳️', description: 'Created first poll' },
  { id: 'event_organizer', name: 'Event Organizer', icon: '📢', description: 'Created first event' },
  { id: 'job_poster', name: 'Job Poster', icon: '💼', description: 'Posted first job' },
  { id: 'goal_setter', name: 'Goal Setter', icon: '🎯', description: 'Set your first goal' },
  { id: 'group_leader', name: 'Group Leader', icon: '👥', description: 'Created a group' },
];

export function getBadgeDefinitions() { return BADGE_DEFS; }

export async function awardBadge(userId: string, badgeId: string) {
  const def = BADGE_DEFS.find(b => b.id === badgeId);
  if (!def) return;
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: buildKey('USER', userId), SK: `BADGE#${badgeId}`, entityType: 'BADGE', ...def, earnedAt: isoNow() } }));
}

export async function getUserBadges(userId: string) {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': buildKey('USER', userId), ':sk': 'BADGE#' } }));
  return r.Items || [];
}

// ─── Booking (Office Hours) ────────────────────────────────────────────────
// PK+SK only

export async function createSlot(mentorId: string, params: { dateTime: string; duration: number }) {
  const id = generateId();
  const item = { PK: buildKey('SLOTS', mentorId), SK: `SLOT#${params.dateTime}`, entityType: 'SLOT', id, mentorId, ...params, isBooked: false, bookedBy: null, createdAt: isoNow() };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getMentorSlots(mentorId: string) {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': buildKey('SLOTS', mentorId), ':sk': 'SLOT#' } }));
  return r.Items || [];
}

export async function bookSlot(mentorId: string, dateTime: string, studentId: string) {
  await dynamoDb.send(new UpdateCommand({ TableName: TABLE_NAME, Key: { PK: buildKey('SLOTS', mentorId), SK: `SLOT#${dateTime}` }, UpdateExpression: 'SET isBooked = :b, bookedBy = :s', ExpressionAttributeValues: { ':b': true, ':s': studentId } }));
}

// ─── Resources ──────────────────────────────────────────────────────────────
// GSI1: COLLECTION#RESOURCES / DATE#<createdAt>

export async function createResource(params: { title: string; description: string; fileUrl: string; subject: string; uploadedBy: string }) {
  const id = generateId();
  const item = { PK: buildKey('RESOURCE', id), SK: 'META', GSI1PK: 'COLLECTION#RESOURCES', GSI1SK: buildKey('DATE', isoNow()), entityType: 'RESOURCE', id, ...params, downloads: 0, createdAt: isoNow() };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getAllResources() {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, IndexName: 'GSI1', KeyConditionExpression: 'GSI1PK = :pk', ExpressionAttributeValues: { ':pk': 'COLLECTION#RESOURCES' }, ScanIndexForward: false }));
  return r.Items || [];
}
