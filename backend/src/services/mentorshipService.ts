import { PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { MentorshipEntity } from '../types/entities';
import { MentorshipStatus, MentorshipChannel } from '../types/enums';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';
import { NotFoundError, ValidationError } from '../utils/errors';

/**
 * Create a new mentorship request from a student to a mentor.
 *
 * GSI1: MENTOR#<mentorId> / STATUS#<status>  — mentor dashboard
 * GSI2: STUDENT#<studentId> / STATUS#<status> — student dashboard
 *
 * Single PutCommand — no duplicate entry needed.
 */
export async function createMentorshipRequest(params: {
  studentId: string;
  mentorId: string;
  topic: string;
}): Promise<MentorshipEntity> {
  const id = generateId();
  const now = isoNow();

  const mentorship: MentorshipEntity = {
    PK: buildKey('MENTORSHIP', id),
    SK: 'DETAILS',
    GSI1PK: buildKey('MENTOR', params.mentorId),
    GSI1SK: buildKey('STATUS', MentorshipStatus.PENDING),
    GSI2PK: buildKey('STUDENT', params.studentId),
    GSI2SK: buildKey('STATUS', MentorshipStatus.PENDING),
    entityType: 'MENTORSHIP',
    id,
    studentId: params.studentId,
    mentorId: params.mentorId,
    topic: params.topic,
    status: MentorshipStatus.PENDING,
    channel: null,
    scheduledTime: null,
    createdAt: now,
    updatedAt: now,
  };

  await dynamoDb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: mentorship,
    })
  );

  return mentorship;
}

/**
 * Get a mentorship request by ID.
 */
export async function getMentorshipById(
  mentorshipId: string
): Promise<MentorshipEntity> {
  const result = await dynamoDb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('MENTORSHIP', mentorshipId),
        SK: 'DETAILS',
      },
    })
  );

  if (!result.Item) {
    throw new NotFoundError('Mentorship request', mentorshipId);
  }

  return result.Item as MentorshipEntity;
}

/**
 * Respond to a mentorship request (ACCEPT or REJECT).
 * Updates GSI1SK and GSI2SK to reflect new status.
 */
export async function respondToMentorship(params: {
  mentorshipId: string;
  status: MentorshipStatus.ACCEPTED | MentorshipStatus.REJECTED;
  channel?: MentorshipChannel;
  scheduledTime?: string;
}): Promise<MentorshipEntity> {
  const now = isoNow();

  if (params.status === MentorshipStatus.ACCEPTED) {
    if (!params.channel) {
      throw new ValidationError('Channel is required when accepting a mentorship', {
        channel: 'Required field',
      });
    }
  }

  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('MENTORSHIP', params.mentorshipId),
        SK: 'DETAILS',
      },
      UpdateExpression:
        'SET #status = :status, #channel = :channel, scheduledTime = :time, updatedAt = :now, GSI1SK = :gsi1sk, GSI2SK = :gsi2sk',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#channel': 'channel',
      },
      ExpressionAttributeValues: {
        ':status': params.status,
        ':channel': params.channel || null,
        ':time': params.scheduledTime || null,
        ':now': now,
        ':pending': MentorshipStatus.PENDING,
        ':gsi1sk': buildKey('STATUS', params.status),
        ':gsi2sk': buildKey('STATUS', params.status),
      },
      ConditionExpression: '#status = :pending',
    })
  );

  return getMentorshipById(params.mentorshipId);
}

/**
 * Mark a mentorship as COMPLETED.
 * Updates GSI1SK and GSI2SK.
 */
export async function completeMentorship(
  mentorshipId: string
): Promise<MentorshipEntity> {
  const now = isoNow();

  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('MENTORSHIP', mentorshipId),
        SK: 'DETAILS',
      },
      UpdateExpression:
        'SET #status = :completed, updatedAt = :now, GSI1SK = :gsi1sk, GSI2SK = :gsi2sk',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':completed': MentorshipStatus.COMPLETED,
        ':now': now,
        ':accepted': MentorshipStatus.ACCEPTED,
        ':gsi1sk': buildKey('STATUS', MentorshipStatus.COMPLETED),
        ':gsi2sk': buildKey('STATUS', MentorshipStatus.COMPLETED),
      },
      ConditionExpression: '#status = :accepted',
    })
  );

  return getMentorshipById(mentorshipId);
}

/**
 * Get all mentorship requests for a student.
 * Uses GSI2: GSI2PK = STUDENT#<studentId>
 */
export async function getMentorshipsForStudent(
  studentId: string
): Promise<MentorshipEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk',
      ExpressionAttributeValues: {
        ':pk': buildKey('STUDENT', studentId),
      },
      ScanIndexForward: false,
    })
  );

  return (result.Items || []) as MentorshipEntity[];
}

/**
 * Get all mentorship requests for a mentor.
 * Uses GSI1: GSI1PK = MENTOR#<mentorId>
 */
export async function getMentorshipsForMentor(
  mentorId: string
): Promise<MentorshipEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: {
        ':pk': buildKey('MENTOR', mentorId),
      },
      ScanIndexForward: false,
    })
  );

  return (result.Items || []) as MentorshipEntity[];
}
