import { PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { ChatRoomEntity, MessageEntity } from '../types/entities';
import { TABLE_NAME, buildKey, generateId, isoNow, sortedUserPair } from '../utils/helpers';
import { NotFoundError } from '../utils/errors';

/**
 * Create a new chat room between two participants.
 *
 * GSI1: USER#<A> / CHATROOM#<B>   — participant A's rooms
 * GSI2: USER#<B> / CHATROOM#<A>   — participant B's rooms (inverted)
 *
 * Single PutCommand — no duplicate MEMBER# entry needed.
 */
export async function createChatRoom(
  participantOneId: string,
  participantTwoId: string
): Promise<ChatRoomEntity> {
  const [sortedA, sortedB] = sortedUserPair(participantOneId, participantTwoId);
  const id = generateId();
  const now = isoNow();

  const chatRoom: ChatRoomEntity = {
    PK: buildKey('CHATROOM', id),
    SK: 'META',
    GSI1PK: buildKey('USER', sortedA),
    GSI1SK: buildKey('CHATROOM', sortedB),
    GSI2PK: buildKey('USER', sortedB),
    GSI2SK: buildKey('CHATROOM', sortedA),
    entityType: 'CHAT_ROOM',
    id,
    participantOneId: sortedA,
    participantTwoId: sortedB,
    lastMessagePreview: '',
    updatedAt: now,
    createdAt: now,
  };

  await dynamoDb.send(
    new PutCommand({ TableName: TABLE_NAME, Item: chatRoom })
  );

  return chatRoom;
}

/**
 * Check if a chat room already exists between two users.
 * Uses GSI1: USER#<A> / CHATROOM#<B>
 */
export async function findChatRoomBetweenUsers(
  userA: string,
  userB: string
): Promise<ChatRoomEntity | null> {
  const [sortedA, sortedB] = sortedUserPair(userA, userB);

  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', sortedA),
        ':sk': buildKey('CHATROOM', sortedB),
      },
      Limit: 1,
    })
  );

  if (result.Items && result.Items.length > 0) {
    return result.Items[0] as ChatRoomEntity;
  }

  return null;
}

/**
 * Get or create a chat room between two users.
 */
export async function getOrCreateChatRoom(
  userA: string,
  userB: string
): Promise<ChatRoomEntity> {
  const existing = await findChatRoomBetweenUsers(userA, userB);
  if (existing) return existing;
  return createChatRoom(userA, userB);
}

/**
 * Get a chat room by ID.
 */
export async function getChatRoomById(roomId: string): Promise<ChatRoomEntity> {
  const result = await dynamoDb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('CHATROOM', roomId),
        SK: 'META',
      },
    })
  );

  if (!result.Item) {
    throw new NotFoundError('ChatRoom', roomId);
  }

  return result.Item as ChatRoomEntity;
}

/**
 * Get all chat rooms for a user (both directions via GSI1 + GSI2).
 */
export async function getChatRoomsForUser(userId: string): Promise<ChatRoomEntity[]> {
  // GSI1 side — rooms where user is participant A
  const gsi1Result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userId),
        ':skPrefix': 'CHATROOM#',
      },
      ScanIndexForward: false,
    })
  );

  // GSI2 side — rooms where user is participant B (inverted lookup)
  const gsi2Result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userId),
        ':skPrefix': 'CHATROOM#',
      },
      ScanIndexForward: false,
    })
  );

  // Deduplicate
  const all = [
    ...(gsi1Result.Items || []),
    ...(gsi2Result.Items || []),
  ] as ChatRoomEntity[];

  const seen = new Set<string>();
  return all.filter((room) => {
    if (seen.has(room.id)) return false;
    seen.add(room.id);
    return true;
  });
}

/**
 * Send a message in a chat room.
 */
export async function sendMessage(params: {
  roomId: string;
  senderId: string;
  content: string;
}): Promise<MessageEntity> {
  const id = generateId();
  const now = isoNow();

  const message: MessageEntity = {
    PK: buildKey('CHATROOM', params.roomId),
    SK: buildKey('MSG', `${now}#${id}`),
    entityType: 'MESSAGE',
    id,
    roomId: params.roomId,
    senderId: params.senderId,
    content: params.content,
    timestamp: now,
    isRead: false,
  };

  await dynamoDb.send(
    new PutCommand({ TableName: TABLE_NAME, Item: message })
  );

  const preview = params.content.length > 100
    ? params.content.substring(0, 100) + '...'
    : params.content;

  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('CHATROOM', params.roomId),
        SK: 'META',
      },
      UpdateExpression: 'SET lastMessagePreview = :preview, updatedAt = :now',
      ExpressionAttributeValues: {
        ':preview': preview,
        ':now': now,
      },
    })
  );

  return message;
}

/**
 * Get messages in a chat room.
 */
export async function getMessages(
  roomId: string,
  limit = 50,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<{ messages: MessageEntity[]; lastKey?: Record<string, unknown> }> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('CHATROOM', roomId),
        ':skPrefix': 'MSG#',
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey as Record<string, any> | undefined,
    })
  );

  return {
    messages: (result.Items || []) as MessageEntity[],
    lastKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
  };
}

/**
 * Mark messages as read up to a given timestamp.
 */
export async function markMessagesAsRead(
  roomId: string,
  upToTimestamp: string,
  readerId: string
): Promise<void> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      FilterExpression: 'isRead = :false AND senderId <> :readerId',
      ExpressionAttributeValues: {
        ':pk': buildKey('CHATROOM', roomId),
        ':skPrefix': 'MSG#',
        ':false': false,
        ':readerId': readerId,
      },
    })
  );

  if (result.Items) {
    const updatePromises = result.Items.map((item) =>
      dynamoDb.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { PK: item.PK, SK: item.SK },
          UpdateExpression: 'SET isRead = :true',
          ExpressionAttributeValues: { ':true': true },
        })
      )
    );
    await Promise.all(updatePromises);
  }
}
