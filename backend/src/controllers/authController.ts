import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, RegisterUserBody } from '../types/requests';
import { Role } from '../types/enums';
import { createUser, getUserById, updateProfile } from '../services/userService';
import { getPresignedUploadUrl } from '../config/s3';
import { ValidationError } from '../utils/errors';

/**
 * POST /api/auth/register
 * Register a new user profile after Firebase signup.
 */
export async function registerUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fullName, email, role, domain, skills, profilePicUrl } =
      req.body as RegisterUserBody;

    if (!fullName || !email || !role) {
      throw new ValidationError('fullName, email, and role are required', {
        fullName: fullName ? '' : 'Required',
        email: email ? '' : 'Required',
        role: role ? '' : 'Required',
      });
    }

    if (!Object.values(Role).includes(role)) {
      throw new ValidationError(`Invalid role: ${role}`);
    }

    const user = await createUser({
      id: req.user.uid,
      email,
      fullName,
      role,
      domain,
      skills,
      profilePicUrl,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Get current user's profile.
 */
export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await getUserById(req.user.uid);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/user/:userId
 * Get a user's public profile.
 */
export async function getUserProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await getUserById(req.params.userId);
    // Strip sensitive fields for public view
    const { PK, SK, GSI1PK, GSI1SK, isBanned, ...publicProfile } = user;
    res.json({ success: true, data: publicProfile });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/auth/me
 * Update the current user's editable profile fields.
 */
export async function updateMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fullName, profilePicUrl, skills, domain, bio, workplace } = req.body as {
      fullName?: string;
      profilePicUrl?: string;
      skills?: string[];
      domain?: string;
      bio?: string;
      workplace?: string;
    };

    if (fullName !== undefined && fullName.trim().length === 0) {
      throw new ValidationError('fullName cannot be empty');
    }

    const updated = await updateProfile(req.user.uid, {
      fullName: fullName?.trim(),
      profilePicUrl,
      skills,
      domain: domain?.trim(),
      bio: bio?.trim(),
      workplace: workplace?.trim(),
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[updateMe] Error updating profile for uid:', req.user?.uid, error.message || error);
    next(error);
  }
}

/**
 * GET /api/auth/upload-url
 * Get a pre-signed S3 URL for uploading a profile picture.
 */
export async function getUploadUrl(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { key, contentType } = req.query as { key: string; contentType: string };
    if (!key || !contentType) {
      throw new ValidationError('key and contentType query params are required');
    }
    const uploadUrl = await getPresignedUploadUrl(key, contentType, 300);
    const publicUrl = `https://${process.env.S3_BUCKET || 'alumniconnect-uploads'}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    res.json({ success: true, data: { uploadUrl, publicUrl } });
  } catch (error) {
    next(error);
  }
}
