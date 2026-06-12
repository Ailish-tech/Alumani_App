import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
  getFollowCounts,
} from '../services/followService';
import { batchGetUsers } from '../utils/batchHelpers';

/**
 * POST /api/follow/:userId — Follow a user
 */
export async function followUserHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await followUser(req.user.uid, req.params.userId);
    res.json({ success: true, message: 'Followed successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/follow/:userId — Unfollow a user
 */
export async function unfollowUserHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await unfollowUser(req.user.uid, req.params.userId);
    res.json({ success: true, message: 'Unfollowed successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/follow/:userId/status — Check if current user follows target
 */
export async function getFollowStatusHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isFollowing = await getFollowStatus(req.user.uid, req.params.userId);
    res.json({ success: true, data: { isFollowing } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/follow/:userId/counts — Get follower/following counts
 */
export async function getFollowCountsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const counts = await getFollowCounts(req.params.userId);
    res.json({ success: true, data: counts });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/follow/:userId/followers — Get list of followers with profile data
 */
export async function getFollowersHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const follows = await getFollowers(req.params.userId);
    const followerIds = follows.map((f) => f.followerId);
    const usersMap = await batchGetUsers(followerIds);
    const users = followerIds
      .map((id) => usersMap.get(id))
      .filter(Boolean);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/follow/:userId/following — Get list of following with profile data
 */
export async function getFollowingHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const follows = await getFollowing(req.params.userId);
    const followingIds = follows.map((f) => f.followingId);
    const usersMap = await batchGetUsers(followingIds);
    const users = followingIds
      .map((id) => usersMap.get(id))
      .filter(Boolean);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
}

