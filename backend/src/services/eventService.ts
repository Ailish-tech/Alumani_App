import { PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';
import { syncEvent, removeEvent } from './typesenseSync';

// ─── Event Service ──────────────────────────────────────────────────────────────
// GSI1: COLLECTION#EVENTS / DATE#<date>       — list all events
// RSVP GSI1: USER#<userId> / EVENT#<eventId>  — "what events did user attend?"

export async function createEvent(params: {
  title: string; description: string; date: string;
  location: string; type: string; imageUrl?: string; createdBy: string;
}) {
  const id = generateId();
  const now = isoNow();
  const item = {
    PK: buildKey('EVENT', id), SK: 'META',
    GSI1PK: 'COLLECTION#EVENTS', GSI1SK: buildKey('DATE', params.date || now),
    entityType: 'EVENT',
    id, ...params, imageUrl: params.imageUrl || '',
    rsvpCount: 0, createdAt: now,
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  await syncEvent(item);
  return item;
}

export async function getAllEvents() {
  const result = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME, IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': 'COLLECTION#EVENTS' },
    ScanIndexForward: true,
  }));
  return result.Items || [];
}

export async function getEventById(eventId: string) {
  const result = await dynamoDb.send(new GetCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('EVENT', eventId), SK: 'META' },
  }));
  return result.Item || null;
}

export async function rsvpToEvent(eventId: string, userId: string, status: string) {
  const item = {
    PK: buildKey('EVENT', eventId), SK: buildKey('USER', userId),
    GSI1PK: buildKey('USER', userId), GSI1SK: buildKey('EVENT', eventId),
    entityType: 'EVENT_RSVP', userId, status: status || 'going', createdAt: isoNow(),
  };
  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  await dynamoDb.send(new UpdateCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('EVENT', eventId), SK: 'META' },
    UpdateExpression: 'ADD rsvpCount :inc',
    ExpressionAttributeValues: { ':inc': 1 },
  }));
  return item;
}

export async function getEventRsvps(eventId: string) {
  const result = await dynamoDb.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': buildKey('EVENT', eventId), ':sk': 'USER#' },
  }));
  return result.Items || [];
}

export async function deleteEvent(eventId: string) {
  await dynamoDb.send(new DeleteCommand({
    TableName: TABLE_NAME, Key: { PK: buildKey('EVENT', eventId), SK: 'META' },
  }));
  await removeEvent(eventId);
}
