import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getFeed,
  createPostHandler,
  deletePostHandler,
  toggleCommentsHandler,
  likePostHandler,
  unlikePostHandler,
  getPostLikes,
  commentOnPostHandler,
  deleteCommentHandler,
  getPostComments,
  bookmarkPostHandler,
  unbookmarkPostHandler,
  getSavedPostsHandler,
  getUploadUrl,
  getMyPosts,
  getUserPosts,
} from '../controllers/postController';
import { AuthenticatedRequest } from '../types/requests';

const router = Router();

// ── Feed ─────────────────────────────────────────────────────────
router.get('/feed', authMiddleware, (req, res, next) =>
  getFeed(req as AuthenticatedRequest, res, next)
);

// ── Create Post ──────────────────────────────────────────────────
router.post('/', authMiddleware, (req, res, next) =>
  createPostHandler(req as AuthenticatedRequest, res, next)
);

// ── Static routes (must come before /:postId) ────────────────────
router.get('/my', authMiddleware, (req, res, next) =>
  getMyPosts(req as AuthenticatedRequest, res, next)
);

router.get('/saved', authMiddleware, (req, res, next) =>
  getSavedPostsHandler(req as AuthenticatedRequest, res, next)
);

router.post('/upload-url', authMiddleware, (req, res, next) =>
  getUploadUrl(req as AuthenticatedRequest, res, next)
);

router.get('/user/:userId', authMiddleware, (req, res, next) =>
  getUserPosts(req as AuthenticatedRequest, res, next)
);

// ── Post Actions (uses :postId) ──────────────────────────────────
router.delete('/:postId', authMiddleware, (req, res, next) =>
  deletePostHandler(req as AuthenticatedRequest, res, next)
);

router.patch('/:postId/toggle-comments', authMiddleware, (req, res, next) =>
  toggleCommentsHandler(req as AuthenticatedRequest, res, next)
);

// ── Like / Unlike ────────────────────────────────────────────────
router.post('/:postId/like', authMiddleware, (req, res, next) =>
  likePostHandler(req as AuthenticatedRequest, res, next)
);

router.post('/:postId/unlike', authMiddleware, (req, res, next) =>
  unlikePostHandler(req as AuthenticatedRequest, res, next)
);

router.get('/:postId/likes', authMiddleware, (req, res, next) =>
  getPostLikes(req as AuthenticatedRequest, res, next)
);

// ── Comments ─────────────────────────────────────────────────────
router.post('/:postId/comment', authMiddleware, (req, res, next) =>
  commentOnPostHandler(req as AuthenticatedRequest, res, next)
);

router.get('/:postId/comments', authMiddleware, (req, res, next) =>
  getPostComments(req as AuthenticatedRequest, res, next)
);

router.delete('/:postId/comments/:commentId', authMiddleware, (req, res, next) =>
  deleteCommentHandler(req as AuthenticatedRequest, res, next)
);

// ── Bookmark / Save ──────────────────────────────────────────────
router.post('/:postId/bookmark', authMiddleware, (req, res, next) =>
  bookmarkPostHandler(req as AuthenticatedRequest, res, next)
);

router.delete('/:postId/bookmark', authMiddleware, (req, res, next) =>
  unbookmarkPostHandler(req as AuthenticatedRequest, res, next)
);

export default router;
