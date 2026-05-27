import { PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { ConnectionEntity } from '../types/entities';
import { ConnectionStatus } from '../types/enums';
import { TABLE_NAME, buildKey, sortedUserPair, isoNow, generateId } from '../utils/helpers';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';

/**
 * Send a connection request from requester to target.
 */
export async function sendConnectionRequest(
  requesterId: string,
  targetId: string
): Promise<ConnectionEntity> {
  if (requesterId === targetId) {
    throw new ValidationError('You cannot connect with yourself');
  }

  const [userA, userB] = sortedUserPair(requesterId, targetId);
  const now = isoNow();

  const connection: ConnectionEntity = {
    PK: buildKey('USER', userA),
    SK: buildKey('CONN', userB),
    GSI1PK: buildKey('USER', userB),
    GSI1SK: buildKey('CONN', userA),
    entityType: 'CONNECTION',
    userA,
    userB,
    status: ConnectionStatus.PENDING,
    requesterId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: connection,
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      throw new ConflictError('Connection request already exists between these users');
    }
    throw err;
  }

  return connection;
}

/**
 * Respond to a connection request (ACCEPT or REJECT).
 */
export async function respondToConnection(
  responderId: string,
  otherUserId: string,
  newStatus: ConnectionStatus.ACCEPTED | ConnectionStatus.REJECTED
): Promise<ConnectionEntity> {
  const [userA, userB] = sortedUserPair(responderId, otherUserId);
  const now = isoNow();

  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('USER', userA),
        SK: buildKey('CONN', userB),
      },
      UpdateExpression: 'SET #status = :newStatus, updatedAt = :now',
      ConditionExpression: '#status = :pending AND requesterId <> :responderId',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':newStatus': newStatus,
        ':pending': ConnectionStatus.PENDING,
        ':responderId': responderId,
        ':now': now,
      },
    })
  );

  // Fetch and return updated connection
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userA),
        ':sk': buildKey('CONN', userB),
      },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    throw new NotFoundError('Connection');
  }

  return result.Items[0] as ConnectionEntity;
}

/**
 * Get all connections for a user (both directions via GSI1).
 */
export async function getConnectionsForUser(
  userId: string,
  statusFilter?: ConnectionStatus
): Promise<ConnectionEntity[]> {
  // Query from PK side
  const directResult = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      FilterExpression: statusFilter ? '#status = :statusFilter' : undefined,
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userId),
        ':skPrefix': 'CONN#',
        ...(statusFilter && { ':statusFilter': statusFilter }),
      },
      ExpressionAttributeNames: statusFilter ? { '#status': 'status' } : undefined,
    })
  );

  // Query from GSI1 side (reverse lookup)
  const reverseResult = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :skPrefix)',
      FilterExpression: statusFilter ? '#status = :statusFilter' : undefined,
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userId),
        ':skPrefix': 'CONN#',
        ...(statusFilter && { ':statusFilter': statusFilter }),
      },
      ExpressionAttributeNames: statusFilter ? { '#status': 'status' } : undefined,
    })
  );

  const all = [
    ...(directResult.Items || []),
    ...(reverseResult.Items || []),
  ] as ConnectionEntity[];

  // Deduplicate by userA+userB combo
  const seen = new Set<string>();
  return all.filter((conn) => {
    const key = `${conn.userA}-${conn.userB}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Get IDs of all users connected (ACCEPTED) with a given user.
 */
export async function getAcceptedConnectionIds(userId: string): Promise<string[]> {
  const connections = await getConnectionsForUser(userId, ConnectionStatus.ACCEPTED);
  return connections.map((c) => (c.userA === userId ? c.userB : c.userA));
}
