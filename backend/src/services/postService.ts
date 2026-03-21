import { PutCommand, GetCommand, DeleteCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb } from '../config/db';
import { PostEntity, PostLikeEntity, PostCommentEntity, PostBookmarkEntity } from '../types/entities';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';
import { NotFoundError, ConflictError } from '../utils/errors';

// ═══════════════════════════════════════════════════════════════════════════════
// POST CRUD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new post.
 */
export async function createPost(params: {
  authorId: string;
  textContent: string;
  mediaUrl?: string;
  mediaUrls?: string[];
}): Promise<PostEntity> {
  const id = generateId();
  const now = isoNow();
  const urls = params.mediaUrls || (params.mediaUrl ? [params.mediaUrl] : []);

  const post: PostEntity = {
    PK: buildKey('POST', id),
    SK: 'DETAILS',
    GSI1PK: buildKey('USER', params.authorId),
    GSI1SK: buildKey('POST', now),
    GSI2PK: 'GLOBAL#FEED',
    GSI2SK: buildKey('POST', now),
    entityType: 'POST',
    id,
    authorId: params.authorId,
    textContent: params.textContent,
    mediaUrl: urls[0] || null,
    mediaUrls: urls,
    likesCount: 0,
    commentsCount: 0,
    commentsDisabled: false,
    createdAt: now,
  };

  await dynamoDb.send(new PutCommand({ TableName: TABLE_NAME, Item: post }));
  return post;
}

/**
 * Get a post by ID.
 */
export async function getPostById(postId: string): Promise<PostEntity> {
  const result = await dynamoDb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('POST', postId), SK: 'DETAILS' },
    })
  );
  if (!result.Item) throw new NotFoundError('Post', postId);
  return result.Item as PostEntity;
}

/**
 * Delete a post (author or admin moderation).
 */
export async function deletePost(postId: string): Promise<void> {
  await dynamoDb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('POST', postId), SK: 'DETAILS' },
    })
  );
}

/**
 * Toggle comments on/off for a post (only post author can do this).
 */
export async function toggleComments(postId: string, disabled: boolean): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('POST', postId), SK: 'DETAILS' },
      UpdateExpression: 'SET commentsDisabled = :d',
      ExpressionAttributeValues: { ':d': disabled },
    })
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIKE / UNLIKE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Like a post. Creates a LIKE item and increments likesCount.
 */
export async function likePost(postId: string, userId: string): Promise<void> {
  const now = isoNow();

  const like: PostLikeEntity = {
    PK: buildKey('POST', postId),
    SK: buildKey('LIKE', userId),
    entityType: 'POST_LIKE',
    postId,
    userId,
    createdAt: now,
  };

  try {
    await dynamoDb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: like,
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      throw new ConflictError('You have already liked this post');
    }
    throw err;
  }

  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('POST', postId), SK: 'DETAILS' },
      UpdateExpression: 'SET likesCount = likesCount + :inc',
      ExpressionAttributeValues: { ':inc': 1 },
    })
  );
}

/**
 * Unlike a post. Removes the LIKE item and decrements likesCount.
 */
export async function unlikePost(postId: string, userId: string): Promise<void> {
  // Check if like exists
  const result = await dynamoDb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('POST', postId), SK: buildKey('LIKE', userId) },
    })
  );

  if (!result.Item) {
    throw new NotFoundError('Like', userId);
  }

  await dynamoDb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('POST', postId), SK: buildKey('LIKE', userId) },
    })
  );

  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('POST', postId), SK: 'DETAILS' },
      UpdateExpression: 'SET likesCount = likesCount - :dec',
      ExpressionAttributeValues: { ':dec': 1 },
    })
  );
}

/**
 * Get likes for a post (who liked it).
 */
export async function getLikesForPost(postId: string): Promise<PostLikeEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('POST', postId),
        ':skPrefix': 'LIKE#',
      },
      ScanIndexForward: false,
    })
  );
  return (result.Items || []) as PostLikeEntity[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMENTS (with replies)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Add a comment (or reply) to a post.
 */
export async function addComment(params: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
  replyToAuthorId?: string;
}): Promise<PostCommentEntity> {
  const id = generateId();
  const now = isoNow();

  const comment: PostCommentEntity = {
    PK: buildKey('POST', params.postId),
    SK: buildKey('COMMENT', id),
    entityType: 'POST_COMMENT',
    id,
    postId: params.postId,
    authorId: params.authorId,
    content: params.content,
    parentId: params.parentId || null,
    replyToAuthorId: params.replyToAuthorId || null,
    createdAt: now,
  };

  await dynamoDb.send(
    new PutCommand({ TableName: TABLE_NAME, Item: comment })
  );

  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('POST', params.postId), SK: 'DETAILS' },
      UpdateExpression: 'SET commentsCount = commentsCount + :inc',
      ExpressionAttributeValues: { ':inc': 1 },
    })
  );

  return comment;
}

/**
 * Delete a comment. Only post author or comment author can delete.
 */
export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await dynamoDb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('POST', postId),
        SK: buildKey('COMMENT', commentId),
      },
    })
  );

  // Decrement commentsCount
  await dynamoDb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: buildKey('POST', postId), SK: 'DETAILS' },
      UpdateExpression: 'SET commentsCount = commentsCount - :dec',
      ExpressionAttributeValues: { ':dec': 1 },
    })
  );
}

/**
 * Get comments for a post.
 */
export async function getCommentsForPost(postId: string): Promise<PostCommentEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('POST', postId),
        ':skPrefix': 'COMMENT#',
      },
      ScanIndexForward: true,
    })
  );
  return (result.Items || []) as PostCommentEntity[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKMARK / SAVE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bookmark (save) a post.
 */
export async function bookmarkPost(userId: string, postId: string): Promise<void> {
  const now = isoNow();

  const bookmark: PostBookmarkEntity = {
    PK: buildKey('USER', userId),
    SK: buildKey('BOOKMARK', postId),
    entityType: 'POST_BOOKMARK',
    userId,
    postId,
    createdAt: now,
  };

  await dynamoDb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: bookmark,
    })
  );
}

/**
 * Remove a bookmark (unsave a post).
 */
export async function unbookmarkPost(userId: string, postId: string): Promise<void> {
  await dynamoDb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('USER', userId),
        SK: buildKey('BOOKMARK', postId),
      },
    })
  );
}

/**
 * Get all bookmarked posts for a user.
 */
export async function getBookmarksForUser(userId: string): Promise<PostBookmarkEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userId),
        ':skPrefix': 'BOOKMARK#',
      },
      ScanIndexForward: false,
    })
  );
  return (result.Items || []) as PostBookmarkEntity[];
}

/**
 * Check if a user has bookmarked a post.
 */
export async function isPostBookmarked(userId: string, postId: string): Promise<boolean> {
  const result = await dynamoDb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: buildKey('USER', userId),
        SK: buildKey('BOOKMARK', postId),
      },
    })
  );
  return !!result.Item;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEED QUERIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the global feed (newest first).
 */
export async function getGlobalFeed(limit = 20): Promise<PostEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gf',
      ExpressionAttributeValues: { ':gf': 'GLOBAL#FEED' },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (result.Items || []) as PostEntity[];
}

/**
 * Get posts by a specific user.
 */
export async function getPostsByUser(userId: string, limit = 20): Promise<PostEntity[]> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': buildKey('USER', userId),
        ':skPrefix': 'POST#',
      },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return (result.Items || []) as PostEntity[];
}
