import { Server, Socket } from 'socket.io';
import { getFirebaseAdmin } from '../config/firebase';
import { Role } from '../types/enums';
import { sendMessage, markMessagesAsRead, getChatRoomById } from '../services/chatService';
import { createNotification } from '../services/notificationService';
import { NotificationType } from '../types/enums';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: Role;
}

/**
 * Initialize Socket.io event handlers.
 *
 * Authentication: On connection, the client must send a Firebase JWT (or dev token)
 * in the handshake auth. The server verifies and joins the socket to `user:<uid>`.
 *
 * Events handled:
 *   - chat:sendMessage  → persist message to DynamoDB + relay to recipient
 *   - chat:typing       → relay typing indicator to chat partner
 *   - chat:markRead     → mark messages as read in DynamoDB
 *   - disconnect        → cleanup
 */
export function initializeSocketHandlers(io: Server): void {
  // ── Authentication Middleware ──────────────────────────────────────────
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token as string;
      const isDev = process.env.NODE_ENV === 'development';
      const admin = getFirebaseAdmin();
      const isFirebaseReady = admin.apps && admin.apps.length > 0;

      if (isDev && !isFirebaseReady) {
        // Dev mode: accept "dev:<userId>:<role>" format
        if (token && token.startsWith('dev:')) {
          const parts = token.replace('dev:', '').split(':');
          socket.userId = parts[0] || 'mock-user-001';
          socket.userRole = (parts[1] as Role) || Role.STUDENT;
        } else {
          socket.userId = process.env.MOCK_USER_ID || 'mock-user-001';
          socket.userRole = (process.env.MOCK_USER_ROLE as Role) || Role.STUDENT;
        }
        console.log(`🔌 [DEV] Socket connected: ${socket.userId}`);
        return next();
      }

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = await admin.auth().verifyIdToken(token);
      socket.userId = decoded.uid;
      // Role would come from DynamoDB in production; simplified here
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // ── Connection Handler ────────────────────────────────────────────────
  io.on('connection', (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.userId!;

    // Join personal room for targeted notifications
    socket.join(`user:${userId}`);
    console.log(`✅ Socket connected: ${userId} (${socket.id})`);

    // ── chat:sendMessage ──────────────────────────────────────────────
    socket.on(
      'chat:sendMessage',
      async (
        data: { roomId: string; content: string },
        callback?: (response: any) => void
      ) => {
        try {
          if (!data.roomId || !data.content) {
            callback?.({ error: 'roomId and content are required' });
            return;
          }

          // Verify sender is participant
          const room = await getChatRoomById(data.roomId);
          if (room.participantOneId !== userId && room.participantTwoId !== userId) {
            callback?.({ error: 'You are not a participant of this chat room' });
            return;
          }

          // Persist message to DynamoDB
          const message = await sendMessage({
            roomId: data.roomId,
            senderId: userId,
            content: data.content,
          });

          // Determine the recipient
          const recipientId =
            room.participantOneId === userId
              ? room.participantTwoId
              : room.participantOneId;

          // Emit to both participants
          io.to(`user:${userId}`).emit('chat:newMessage', message);
          io.to(`user:${recipientId}`).emit('chat:newMessage', message);

          // Create a notification for the recipient
          const notification = await createNotification({
            userId: recipientId,
            triggeringUserId: userId,
            type: NotificationType.MESSAGE,
            referenceId: data.roomId,
          });
          io.to(`user:${recipientId}`).emit('notification:new', notification);

          callback?.({ success: true, data: message });
        } catch (error: any) {
          console.error('❌ chat:sendMessage error:', error.message);
          callback?.({ error: error.message });
        }
      }
    );

    // ── chat:typing ───────────────────────────────────────────────────
    socket.on(
      'chat:typing',
      async (data: { roomId: string; isTyping: boolean }) => {
        try {
          const room = await getChatRoomById(data.roomId);
          const recipientId =
            room.participantOneId === userId
              ? room.participantTwoId
              : room.participantOneId;

          io.to(`user:${recipientId}`).emit('chat:typing', {
            roomId: data.roomId,
            userId,
            isTyping: data.isTyping,
          });
        } catch (error: any) {
          console.error('❌ chat:typing error:', error.message);
        }
      }
    );

    // ── chat:markRead ─────────────────────────────────────────────────
    socket.on(
      'chat:markRead',
      async (
        data: { roomId: string; upToTimestamp: string },
        callback?: (response: any) => void
      ) => {
        try {
          await markMessagesAsRead(data.roomId, data.upToTimestamp, userId);
          callback?.({ success: true });
        } catch (error: any) {
          console.error('❌ chat:markRead error:', error.message);
          callback?.({ error: error.message });
        }
      }
    );

    // ── disconnect ────────────────────────────────────────────────────
    socket.on('disconnect', (reason: string) => {
      console.log(`❌ Socket disconnected: ${userId} (${reason})`);
    });
  });
}
