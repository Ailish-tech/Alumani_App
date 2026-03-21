import { PutCommand, DeleteCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { TABLE_NAME, buildKey, isoNow } from '../utils/helpers';
import { ConflictError } from '../utils/errors';

// ─── Follow Entity ───────────────────────────────────────────────────────────
// PK:     USER#<followerId>    SK: FOLLOWING#<followingId>
// GSI1PK: USER#<followingId>   GSI1SK: FOLLOWER#<followerId>
// GSI2PK: FOLLOW#COUNTS        GSI2SK: USER#<userId>  (not used, counts are derived)

export interface FollowEntity {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  entityType: 'FOLLOW';
  followerId: string;
  followingId: string;
  createdAt: string;
}

/**
 * Follow a user. Creates a follow relationship.
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) throw new ConflictError('You cannot follow yourself');

  const now = isoNow();
  const follow: FollowEntity = {
    PK: buildKey('USER', followerId),
    SK: buildKey('FOLLOWING', followingId),
    GSI1PK: buildKey('USER', followingId),
    GSI1SK: buildKey('FOLLOWER', followerId),
    entityType: 'FOLLOW',
    followerId,
    followingId,
    createdAt: now,
  };

  try {
    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: follow,
        ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
      })
    );
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      throw new ConflictError('You are already following this user');
    }
    throw err;
  }
}

/**
 * Unfollow a user. Deletes the follow relationship.
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  await dynamoDb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('USER', followerId),
        SK: buildKey('FOLLOWING', followingId),
      },
    })
  );
}

/**
 * Check if follower follows following.
 */
export async function getFollowStatus(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const result = await dynamoDb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('USER', followerId),
        SK: buildKey('FOLLOWING', followingId),
      },
    })
  );
  return !!result.Item;
}

/**
 * Get all users that userId is following.
 * Uses base table: PK = USER#<userId>, SK begins_with FOLLOWING#
 */
export async function getFollowing(userId: string, limit = 50): Promise<FollowEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userId),
        ':skPrefix': 'FOLLOWING#',
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (result.Items || []) as FollowEntity[];
}

/**
 * Get all followers of userId.
 * Uses GSI1: GSI1PK = USER#<userId>, GSI1SK begins_with FOLLOWER#
 */
export async function getFollowers(userId: string, limit = 50): Promise<FollowEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userId),
        ':skPrefix': 'FOLLOWER#',
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (result.Items || []) as FollowEntity[];
}

/**
 * Get follower and following counts for a user.
 */
export async function getFollowCounts(
  userId: string
): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    getFollowers(userId, 1000),
    getFollowing(userId, 1000),
  ]);
  return { followers: followers.length, following: following.length };
}
