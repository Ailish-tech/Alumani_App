import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import { NotificationType } from '../types/enums';
import {
  createPost,
  getPostById,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
  getGlobalFeed,
  getPostsByUser,
  getCommentsForPost,
  getLikesForPost,
  deletePost,
  toggleComments,
  bookmarkPost,
  unbookmarkPost,
  getBookmarksForUser,
  isPostBookmarked,
  batchCheckLikes,
  batchCheckBookmarks,
} from '../services/postService';
import { getAcceptedConnectionIds } from '../services/connectionService';
import { createNotification } from '../services/notificationService';
import { getPresignedUploadUrl } from '../config/s3';
import { ValidationError } from '../utils/errors';
import { generateId, buildKey } from '../utils/helpers';
import { PostEntity } from '../types/entities';
import { getUserById } from '../services/userService';
import { batchGetUsers, batchGetItems } from '../utils/batchHelpers';

// Socket.io instance
let ioInstance: any = null;
export function setIoInstance(io: any): void {
  ioInstance = io;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEED
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/posts/feed
 */
export async function getFeed(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const currentUserId = req.user.uid;
    const connectedIds = await getAcceptedConnectionIds(currentUserId);
    let feed: PostEntity[] = [];

    if (connectedIds.length > 0) {
      const postsPerUser = await Promise.all(
        connectedIds.slice(0, 50).map((uid) => getPostsByUser(uid, 5))
      );
      feed = postsPerUser.flat();
      feed.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      feed = feed.slice(0, 50);
    }

    if (feed.length === 0) {
      feed = await getGlobalFeed(20);
    }

    const postIds = feed.map(p => p.id);
    const authorIds = Array.from(new Set(feed.map(p => p.authorId)));

    // 1 Batch get for all authors
    const authorsMap = await batchGetUsers(authorIds);
    // 1 Batch get for all likes
    const likedPostIds = await batchCheckLikes(postIds, currentUserId);
    // 1 Batch get for all bookmarks
    const bookmarkedPostIds = await batchCheckBookmarks(postIds, currentUserId);

    const enrichedFeed = feed.map(post => {
      const author = authorsMap.get(post.authorId);
      const authorName = author?.fullName || post.authorId.substring(0, 12);
      
      return {
        ...post,
        authorName,
        isLikedByMe: likedPostIds.has(post.id),
        isBookmarked: bookmarkedPostIds.has(post.id),
        likedByNames: [], // Removed to avoid N+1 queries; load on demand instead
      };
    });

    res.json({ success: true, data: enrichedFeed });
  } catch (error) { next(error); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST CRUD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/posts
 */
export async function createPostHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const { textContent, mediaUrl, mediaUrls } = req.body;
    if (!textContent || textContent.trim().length === 0) {
      throw new ValidationError('textContent is required');
    }
    const post = await createPost({
      authorId: req.user.uid, textContent, mediaUrl, mediaUrls,
    });
    res.status(201).json({ success: true, data: post });
  } catch (error) { next(error); }
}

/**
 * DELETE /api/posts/:postId — Delete own post
 */
export async function deletePostHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const post = await getPostById(req.params.postId);
    if (post.authorId !== req.user.uid && (req.user as any).role !== 'ADMIN') {
      throw new ValidationError('Only the post author or admin can delete this post');
    }
    await deletePost(req.params.postId);
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) { next(error); }
}

/**
 * PATCH /api/posts/:postId/toggle-comments — Toggle comments on/off
 */
export async function toggleCommentsHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const post = await getPostById(req.params.postId);
    if (post.authorId !== req.user.uid) {
      throw new ValidationError('Only the post author can toggle comments');
    }
    const disabled = !!req.body.disabled;
    await toggleComments(req.params.postId, disabled);
    res.json({ success: true, data: { commentsDisabled: disabled } });
  } catch (error) { next(error); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIKE / UNLIKE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/posts/:postId/like
 */
export async function likePostHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const { postId } = req.params;
    const user = await getUserById(req.user.uid);
    await likePost(postId, req.user.uid, user.fullName);

    // Notify post author
    const post = await getPostById(postId);
    if (post.authorId !== req.user.uid) {
      const notification = await createNotification({
        userId: post.authorId,
        triggeringUserId: req.user.uid,
        type: NotificationType.LIKE,
        referenceId: postId,
      });
      if (ioInstance) {
        ioInstance.to(`user:${post.authorId}`).emit('notification:new', notification);
      }
    }

    res.json({ success: true, message: 'Post liked' });
  } catch (error) { next(error); }
}

/**
 * POST /api/posts/:postId/unlike
 */
export async function unlikePostHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    await unlikePost(req.params.postId, req.user.uid);
    res.json({ success: true, message: 'Post unliked' });
  } catch (error) { next(error); }
}

/**
 * GET /api/posts/:postId/likes
 */
export async function getPostLikes(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const likes = await getLikesForPost(req.params.postId);
    res.json({ success: true, data: likes });
  } catch (error) { next(error); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMENTS (with replies)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/posts/:postId/comment
 */
export async function commentOnPostHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const { postId } = req.params;
    const { content, parentId, replyToAuthorId } = req.body;

    if (!content || content.trim().length === 0) {
      throw new ValidationError('content is required');
    }

    // Check if comments are disabled
    const post = await getPostById(postId);
    if (post.commentsDisabled) {
      throw new ValidationError('Comments are disabled on this post');
    }

    const comment = await addComment({
      postId, authorId: req.user.uid, content, parentId, replyToAuthorId,
    });

    // Notify post author
    if (post.authorId !== req.user.uid) {
      const notification = await createNotification({
        userId: post.authorId,
        triggeringUserId: req.user.uid,
        type: NotificationType.COMMENT,
        referenceId: postId,
      });
      if (ioInstance) {
        ioInstance.to(`user:${post.authorId}`).emit('notification:new', notification);
      }
    }

    // If replying to someone else, notify them too
    if (replyToAuthorId && replyToAuthorId !== req.user.uid && replyToAuthorId !== post.authorId) {
      const replyNotification = await createNotification({
        userId: replyToAuthorId,
        triggeringUserId: req.user.uid,
        type: NotificationType.COMMENT,
        referenceId: postId,
      });
      if (ioInstance) {
        ioInstance.to(`user:${replyToAuthorId}`).emit('notification:new', replyNotification);
      }
    }

    res.status(201).json({ success: true, data: comment });
  } catch (error) { next(error); }
}

/**
 * DELETE /api/posts/:postId/comments/:commentId
 */
export async function deleteCommentHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const { postId, commentId } = req.params;
    const post = await getPostById(postId);

    // Only post author, comment author, or admin can delete
    // (We check comment ownership in a simple way — if not post author or admin, they can only delete their own)
    const comments = await getCommentsForPost(postId);
    const comment = comments.find(c => c.id === commentId);
    if (!comment) throw new ValidationError('Comment not found');

    const isPostAuthor = post.authorId === req.user.uid;
    const isCommentAuthor = comment.authorId === req.user.uid;
    const isAdmin = (req.user as any).role === 'ADMIN';

    if (!isPostAuthor && !isCommentAuthor && !isAdmin) {
      throw new ValidationError('You do not have permission to delete this comment');
    }

    await deleteComment(postId, commentId);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) { next(error); }
}

/**
 * GET /api/posts/:postId/comments
 */
export async function getPostComments(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const comments = await getCommentsForPost(req.params.postId);
    res.json({ success: true, data: comments });
  } catch (error) { next(error); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKMARK / SAVE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/posts/:postId/bookmark
 */
export async function bookmarkPostHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    await bookmarkPost(req.user.uid, req.params.postId);
    res.json({ success: true, message: 'Post saved' });
  } catch (error) { next(error); }
}

/**
 * DELETE /api/posts/:postId/bookmark
 */
export async function unbookmarkPostHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    await unbookmarkPost(req.user.uid, req.params.postId);
    res.json({ success: true, message: 'Post unsaved' });
  } catch (error) { next(error); }
}

/**
 * GET /api/posts/saved
 */
export async function getSavedPostsHandler(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const bookmarks = await getBookmarksForUser(req.user.uid);
    if (!bookmarks.length) {
      res.json({ success: true, data: [] });
      return;
    }

    // Fetch the actual posts in batch
    const keys = bookmarks.map(b => ({ PK: buildKey('POST', b.postId), SK: 'DETAILS' }));
    const posts = await batchGetItems(keys);

    res.json({ success: true, data: posts });
  } catch (error) { next(error); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD + USER POSTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/posts/upload-url
 */
export async function getUploadUrl(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName || !contentType) {
      throw new ValidationError('fileName and contentType are required');
    }
    const key = `posts/${req.user.uid}/${generateId()}-${fileName}`;
    const uploadUrl = await getPresignedUploadUrl(key, contentType);
    res.json({
      success: true,
      data: {
        uploadUrl,
        fileKey: key,
        publicUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
      },
    });
  } catch (error) { next(error); }
}

/**
 * GET /api/posts/my
 */
export async function getMyPosts(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const posts = await getPostsByUser(req.user.uid);
    res.json({ success: true, data: posts });
  } catch (error) { next(error); }
}

/**
 * GET /api/posts/user/:userId
 */
export async function getUserPosts(
  req: AuthenticatedRequest, res: Response, next: NextFunction
): Promise<void> {
  try {
    const posts = await getPostsByUser(req.params.userId);
    res.json({ success: true, data: posts });
  } catch (error) { next(error); }
}
