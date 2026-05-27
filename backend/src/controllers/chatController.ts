import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import { getChatRoomsForUser, getChatRoomById, getMessages, getOrCreateChatRoom } from '../services/chatService';
import { ForbiddenError } from '../utils/errors';

/**
 * GET /api/chat/rooms
 * Get all chat rooms for the current user.
 */
export async function getChatRooms(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rooms = await getChatRoomsForUser(req.user.uid);
    res.json({ success: true, data: rooms });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chat/rooms/:roomId/messages?limit=50&cursor=...
 * Get paginated messages for a chat room.
 */
export async function getChatMessages(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const cursor = req.query.cursor as string | undefined;

    // Verify user is a participant
    const room = await getChatRoomById(roomId);
    if (room.participantOneId !== req.user.uid && room.participantTwoId !== req.user.uid) {
      throw new ForbiddenError('You are not a participant of this chat room');
    }

    let lastKey: Record<string, unknown> | undefined;
    if (cursor) {
      try {
        lastKey = JSON.parse(Buffer.from(cursor, 'base64').toString());
      } catch {
        // Invalid cursor — ignore and start from beginning
      }
    }

    const result = await getMessages(roomId, limit, lastKey);

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : null;

    res.json({
      success: true,
      data: result.messages,
      pagination: { nextCursor },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/chat/rooms
 * Create or get a chat room with another user.
 * Body: { otherUserId: string }
 */
export async function createOrGetRoom(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { otherUserId } = req.body;
    if (!otherUserId) {
      res.status(400).json({ success: false, error: 'otherUserId is required' });
      return;
    }
    if (otherUserId === req.user.uid) {
      res.status(400).json({ success: false, error: 'Cannot create chat with yourself' });
      return;
    }

    const room = await getOrCreateChatRoom(req.user.uid, otherUserId);
    res.json({ success: true, data: room });
  } catch (error) {
    next(error);
  }
}
