import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { NotificationEntity } from '../types/entities';
import { NotificationType } from '../types/enums';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';

/**
 * Create a notification for a user.
 */
export async function createNotification(params: {
  userId: string;
  triggeringUserId: string;
  type: NotificationType;
  referenceId: string;
}): Promise<NotificationEntity> {
  const id = generateId();
  const now = isoNow();

  const notification: NotificationEntity = {
    PK: buildKey('USER', params.userId),
    SK: buildKey('NOTIF', `${now}#${id}`),
    entityType: 'NOTIFICATION',
    id,
    userId: params.userId,
    triggeringUserId: params.triggeringUserId,
    type: params.type,
    referenceId: params.referenceId,
    readStatus: false,
    createdAt: now,
  };

  await dynamoDb.send(
    new PutCommand({ TableName: TABLE_NAME, Item: notification })
  );

  return notification;
}

/**
 * Get notifications for a user (newest first).
 */
export async function getNotificationsForUser(
  userId: string,
  limit = 30
): Promise<NotificationEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userId),
        ':skPrefix': 'NOTIF#',
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );

  return (result.Items || []) as NotificationEntity[];
}
