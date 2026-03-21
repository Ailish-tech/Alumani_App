import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';

// ─── Alumni Impact Dashboard ────────────────────────────────────────────────
// Queries COLLECTION# partitions via GSI1 with FilterExpression on author

export async function getAlumniImpact(alumniId: string) {
  // Jobs posted — query COLLECTION#JOBS, filter by postedBy
  const jobsR = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    FilterExpression: 'postedBy = :uid',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#JOBS', ':uid': alumniId },
  }));

  // Events created — query COLLECTION#EVENTS, filter by createdBy
  const eventsR = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    FilterExpression: 'createdBy = :uid',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#EVENTS', ':uid': alumniId },
  }));

  // Resources shared — query COLLECTION#RESOURCES, filter by uploadedBy
  const resourcesR = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    FilterExpression: 'uploadedBy = :uid',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#RESOURCES', ':uid': alumniId },
  }));

  // Q&A answers — query COLLECTION#QUESTIONS, filter by authorId
  const answersR = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    FilterExpression: 'authorId = :uid',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#QUESTIONS', ':uid': alumniId },
  }));

  return {
    jobsPosted: (jobsR.Items || []).length,
    eventsCreated: (eventsR.Items || []).length,
    resourcesShared: (resourcesR.Items || []).length,
    questionsAnswered: (answersR.Items || []).length,
  };
}

// ─── Referral System ────────────────────────────────────────────────────────
// GSI1: ALUMNI#<alumniId> / REF#<createdAt>

export async function createReferral(params: {
  alumniId: string; studentId: string; company: string; position: string; note: string;
}) {
  const id = generateId(); const now = isoNow();
  const item = {
    PK: buildKey('REFERRAL', id), SK: 'META',
    GSI1PK: buildKey('ALUMNI', params.alumniId), GSI1SK: buildKey('REF', now),
    entityType: 'REFERRAL', id, ...params,
    status: 'pending',
    createdAt: now,
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getAlumniReferrals(alumniId: string) {
  const r = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': buildKey('ALUMNI', alumniId) },
    ScanIndexForward: false,
  }));
  return r.Items || [];
}

export async function updateReferralStatus(referralId: string, status: string) {
  await dynamoDb.send(new UpdateCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('REFERRAL', referralId), SK: 'META' },
    UpdateExpression: 'SET #s = :s, updatedAt = :u',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': status, ':u': isoNow() },
  }));
}

// ─── Success Stories ────────────────────────────────────────────────────────
// GSI1: COLLECTION#STORIES / DATE#<createdAt>

export async function createStory(params: {
  authorId: string; title: string; content: string; company: string; yearGraduated: string; tags: string[];
}) {
  const id = generateId(); const now = isoNow();
  const item = {
    PK: buildKey('STORY', id), SK: 'META',
    GSI1PK: 'COLLECTION#STORIES', GSI1SK: buildKey('DATE', now),
    entityType: 'SUCCESS_STORY', id, ...params,
    likesCount: 0, featured: false, createdAt: now,
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getAllStories() {
  const r = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#STORIES' },
    ScanIndexForward: false,
  }));
  return r.Items || [];
}

export async function likeStory(storyId: string) {
  await dynamoDb.send(new UpdateCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('STORY', storyId), SK: 'META' },
    UpdateExpression: 'ADD likesCount :inc',
    ExpressionAttributeValues: { ':inc': 1 },
  }));
}

// ─── Company Directory ──────────────────────────────────────────────────────
// GSI1: COLLECTION#COMPANIES / DATE#<createdAt>

export async function registerCompany(params: {
  alumniId: string; companyName: string; role: string; industry: string; location: string; hiringStatus: string; website: string;
}) {
  const id = generateId(); const now = isoNow();
  const item = {
    PK: buildKey('COMPANY', id), SK: 'META',
    GSI1PK: 'COLLECTION#COMPANIES', GSI1SK: buildKey('DATE', now),
    entityType: 'COMPANY', id, ...params,
    createdAt: now,
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getAllCompanies() {
  const r = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#COMPANIES' },
    ScanIndexForward: false,
  }));
  return r.Items || [];
}
