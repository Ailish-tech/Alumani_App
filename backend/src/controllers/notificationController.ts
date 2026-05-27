import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import { getNotificationsForUser } from '../services/notificationService';
import { dynamoDb } from '../config/db';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAME, buildKey } from '../utils/helpers';

/**
 * GET /api/notifications
 * Get all notifications for the current user.
 */
export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 30;
    const notifications = await getNotificationsForUser(req.user.uid, limit);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read.
 */
export async function markNotificationRead(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    // We need to find the notification first to get its SK
    const notifications = await getNotificationsForUser(req.user.uid, 100);
    const notif = notifications.find((n) => n.id === id);
    if (!notif) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: notif.PK, SK: notif.SK },
        UpdateExpression: 'SET readStatus = :read',
        ExpressionAttributeValues: { ':read': true },
      })
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
