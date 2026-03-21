import { PutCommand, GetCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';

// ─── Groups ─────────────────────────────────────────────────────────────────
// GSI1: COLLECTION#GROUPS / DATE#<createdAt>

export async function createGroup(params: { name: string; description: string; category: string; createdBy: string }) {
  const id = generateId(); const now = isoNow();
  const item = { PK: buildKey('GROUP', id), SK: 'META', GSI1PK: 'COLLECTION#GROUPS', GSI1SK: buildKey('DATE', now), entityType: 'GROUP', id, ...params, memberCount: 1, createdAt: now };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  // Auto-join creator
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: buildKey('GROUP', id), SK: `MEMBER#${params.createdBy}`, entityType: 'GROUP_MEMBER', userId: params.createdBy, role: 'admin', joinedAt: now } }));
  return item;
}

export async function getAllGroups() {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, IndexName: 'GSI1', KeyConditionExpression: 'GSI1PK = :pk', ExpressionAttributeValues: { ':pk': 'COLLECTION#GROUPS' }, ScanIndexForward: false }));
  return r.Items || [];
}

export async function getGroupById(groupId: string) {
  const r = await dynamoDb.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: buildKey('GROUP', groupId), SK: 'META' } }));
  return r.Item || null;
}

export async function joinGroup(groupId: string, userId: string) {
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: buildKey('GROUP', groupId), SK: `MEMBER#${userId}`, entityType: 'GROUP_MEMBER', userId, role: 'member', joinedAt: isoNow() } }));
  await dynamoDb.send(new UpdateCommand({ TableName: TABLE_NAME, Key: { PK: buildKey('GROUP', groupId), SK: 'META' }, UpdateExpression: 'ADD memberCount :inc', ExpressionAttributeValues: { ':inc': 1 } }));
}

export async function leaveGroup(groupId: string, userId: string) {
  await dynamoDb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: buildKey('GROUP', groupId), SK: `MEMBER#${userId}` } }));
  await dynamoDb.send(new UpdateCommand({ TableName: TABLE_NAME, Key: { PK: buildKey('GROUP', groupId), SK: 'META' }, UpdateExpression: 'ADD memberCount :inc', ExpressionAttributeValues: { ':inc': -1 } }));
}

export async function getGroupMembers(groupId: string) {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': buildKey('GROUP', groupId), ':sk': 'MEMBER#' } }));
  return r.Items || [];
}

// ─── Polls ──────────────────────────────────────────────────────────────────
// GSI1: COLLECTION#POLLS / DATE#<createdAt>

export async function createPoll(params: { question: string; options: string[]; createdBy: string }) {
  const id = generateId(); const now = isoNow();
  const optionsMap = params.options.reduce((acc: Record<string, number>, o, i) => { acc[`opt${i}`] = 0; return acc; }, {});
  const item = { PK: buildKey('POLL', id), SK: 'META', GSI1PK: 'COLLECTION#POLLS', GSI1SK: buildKey('DATE', now), entityType: 'POLL', id, question: params.question, options: params.options, votes: optionsMap, totalVotes: 0, createdBy: params.createdBy, createdAt: now };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getAllPolls() {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, IndexName: 'GSI1', KeyConditionExpression: 'GSI1PK = :pk', ExpressionAttributeValues: { ':pk': 'COLLECTION#POLLS' }, ScanIndexForward: false }));
  return r.Items || [];
}

export async function votePoll(pollId: string, userId: string, optionIndex: number) {
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: buildKey('POLL', pollId), SK: `VOTE#${userId}`, entityType: 'POLL_VOTE', userId, optionIndex, votedAt: isoNow() } }));
  await dynamoDb.send(new UpdateCommand({ TableName: TABLE_NAME, Key: { PK: buildKey('POLL', pollId), SK: 'META' }, UpdateExpression: `ADD votes.opt${optionIndex} :inc, totalVotes :inc`, ExpressionAttributeValues: { ':inc': 1 } }));
}

// ─── Q&A ────────────────────────────────────────────────────────────────────
// GSI1: COLLECTION#QUESTIONS / DATE#<createdAt>

export async function createQuestion(params: { question: string; isAnonymous: boolean; createdBy: string }) {
  const id = generateId(); const now = isoNow();
  const item = { PK: buildKey('QA', id), SK: 'META', GSI1PK: 'COLLECTION#QUESTIONS', GSI1SK: buildKey('DATE', now), entityType: 'QUESTION', id, ...params, answersCount: 0, createdAt: now };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getAllQuestions() {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, IndexName: 'GSI1', KeyConditionExpression: 'GSI1PK = :pk', ExpressionAttributeValues: { ':pk': 'COLLECTION#QUESTIONS' }, ScanIndexForward: false }));
  return r.Items || [];
}

export async function addAnswer(questionId: string, params: { content: string; authorId: string }) {
  const id = generateId();
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: { PK: buildKey('QA', questionId), SK: `ANS#${id}`, entityType: 'ANSWER', id, ...params, upvotes: 0, createdAt: isoNow() } }));
  await dynamoDb.send(new UpdateCommand({ TableName: TABLE_NAME, Key: { PK: buildKey('QA', questionId), SK: 'META' }, UpdateExpression: 'ADD answersCount :inc', ExpressionAttributeValues: { ':inc': 1 } }));
}

export async function getAnswers(questionId: string) {
  const r = await dynamoDb.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)', ExpressionAttributeValues: { ':pk': buildKey('QA', questionId), ':sk': 'ANS#' } }));
  return r.Items || [];
}
