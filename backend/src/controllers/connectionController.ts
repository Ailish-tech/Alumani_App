import { Response, NextFunction } from 'express';
import {
  AuthenticatedRequest,
  SendConnectionRequestBody,
  RespondConnectionBody,
} from '../types/requests';
import { ConnectionStatus, NotificationType } from '../types/enums';
import {
  sendConnectionRequest,
  respondToConnection,
  getConnectionsForUser,
} from '../services/connectionService';
import { getOrCreateChatRoom } from '../services/chatService';
import { createNotification } from '../services/notificationService';
import { searchUsers } from '../services/userService';
import { ValidationError } from '../utils/errors';

// Socket.io instance
let ioInstance: any = null;
export function setIoInstance(io: any): void {
  ioInstance = io;
}

/**
 * POST /api/connections/request
 * Send a connection request to another user.
 */
export async function sendConnectionRequestHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { targetUserId } = req.body as SendConnectionRequestBody;

    if (!targetUserId) {
      throw new ValidationError('targetUserId is required');
    }

    const connection = await sendConnectionRequest(req.user.uid, targetUserId);

    // Notify the target user
    const notification = await createNotification({
      userId: targetUserId,
      triggeringUserId: req.user.uid,
      type: NotificationType.CONNECTION_REQUEST,
      referenceId: `${connection.userA}-${connection.userB}`,
    });

    if (ioInstance) {
      ioInstance.to(`user:${targetUserId}`).emit('notification:new', notification);
    }

    res.status(201).json({ success: true, data: connection });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/connections/:userId/respond
 * Accept or reject a connection request.
 *
 * CRUCIAL: When PENDING → ACCEPTED, automatically creates a CHAT_ROOM.
 */
export async function respondConnectionHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId: otherUserId } = req.params;
    const { status } = req.body as RespondConnectionBody;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      throw new ValidationError('status must be ACCEPTED or REJECTED');
    }

    const connection = await respondToConnection(
      req.user.uid,
      otherUserId,
      status as ConnectionStatus.ACCEPTED | ConnectionStatus.REJECTED
    );

    // Crucial trigger: On ACCEPTED → auto-create CHAT_ROOM
    let chatRoom = null;
    if (status === 'ACCEPTED') {
      chatRoom = await getOrCreateChatRoom(req.user.uid, otherUserId);

      // Notify the requester that their connection was accepted
      const notification = await createNotification({
        userId: otherUserId,
        triggeringUserId: req.user.uid,
        type: NotificationType.CONNECT_ACCEPT,
        referenceId: `${connection.userA}-${connection.userB}`,
      });

      if (ioInstance) {
        ioInstance.to(`user:${otherUserId}`).emit('notification:new', notification);
      }
    }

    res.json({
      success: true,
      data: { connection, chatRoom },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/connections
 * Get all connections for the current user.
 */
export async function getMyConnections(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const statusFilter = req.query.status as ConnectionStatus | undefined;
    const connections = await getConnectionsForUser(req.user.uid, statusFilter);
    res.json({ success: true, data: connections });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/connections/search?q=...&role=...
 * Search users by name, ID, domain, or skills (like Instagram).
 */
export async function searchUsersHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = (req.query.q as string) || '';
    const role = (req.query.role as string) || '';
    const users = await searchUsers({ query, role: role || undefined });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}
