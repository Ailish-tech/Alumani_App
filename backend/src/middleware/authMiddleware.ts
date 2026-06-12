import { Request, Response, NextFunction } from 'express';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getFirebaseAdmin } from '../config/firebase';
import { dynamoDb } from '../config/db';
import { AuthenticatedRequest, AuthUser } from '../types/requests';
import { Role } from '../types/enums';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { TABLE_NAME, buildKey, isoNow } from '../utils/helpers';

/**
 * Firebase JWT Authentication Middleware.
 *
 * In development mode (NODE_ENV=development) WITHOUT a valid Firebase setup,
 * the middleware injects a mock user from environment variables so you can
 * test all endpoints locally today.
 *
 * In production, it:
 *  1. Extracts the Bearer token from the Authorization header.
 *  2. Verifies the token with Firebase Admin SDK.
 *  3. Fetches the user profile from DynamoDB to get role + banned status.
 *  4. Blocks access if the user is banned.
 *  5. Attaches `req.user` (AuthUser) for downstream handlers.
 */
export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    let authUser: AuthUser;

    const authHeader = req.headers.authorization;

    // ── Development: Check for dev tokens FIRST (even if Firebase is ready) ──
    if (isDev && authHeader && authHeader.startsWith('Bearer dev:')) {
      const parts = authHeader.replace('Bearer dev:', '').split(':');
      authUser = {
        uid: parts[0] || process.env.MOCK_USER_ID || 'mock-user-001',
        role: (parts[1] as Role) || (process.env.MOCK_USER_ROLE as Role) || Role.STUDENT,
        email: `${parts[0] || 'mock'}@dev.local`,
      };
      console.log(`🔓 [DEV] Mock auth → uid=${authUser.uid}, role=${authUser.role}`);
    } else if (isDev && !authHeader) {
      // No auth header in dev mode — use fallback mock user
      authUser = {
        uid: process.env.MOCK_USER_ID || 'mock-user-001',
        role: (process.env.MOCK_USER_ROLE as Role) || Role.STUDENT,
        email: 'mock@dev.local',
      };
      console.log(`🔓 [DEV] Mock auth (no header) → uid=${authUser.uid}, role=${authUser.role}`);
    } else {
      // ── Firebase Verification (production, or real Firebase tokens in dev) ──
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or malformed Authorization header');
      }

      const token = authHeader.split('Bearer ')[1];
      if (!token) {
        throw new UnauthorizedError('Missing token');
      }

      const admin = getFirebaseAdmin();
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Fetch user profile from DynamoDB to get role and banned status
      const userResult = await dynamoDb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: buildKey('USER', decodedToken.uid),
            SK: 'PROFILE',
          },
        })
      );

      let userItem = userResult.Item;

      // ── Auto-create profile if Firebase user exists but DynamoDB profile is missing ──
      if (!userItem) {
        console.log(`🆕 Auto-creating DynamoDB profile for Firebase user: ${decodedToken.uid} (${decodedToken.email})`);
        const now = isoNow();
        const newProfile = {
          PK: buildKey('USER', decodedToken.uid),
          SK: 'PROFILE',
          userId: decodedToken.uid,
          email: decodedToken.email || '',
          fullName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          role: Role.STUDENT,
          avatarUrl: decodedToken.picture || '',
          headline: '',
          domain: '',
          isBanned: false,
          createdAt: now,
          updatedAt: now,
        };

        await dynamoDb.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: newProfile,
          })
        );
        userItem = newProfile;
      }

      if (userItem.isBanned === true) {
        throw new ForbiddenError('Your account has been banned. Contact support.');
      }

      authUser = {
        uid: decodedToken.uid,
        role: userItem.role as Role,
        email: decodedToken.email || userItem.email,
      };
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = authUser;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired authentication token'));
    }
  }
}

export default authMiddleware;

/**
 * Firebase-Only Auth Middleware (for /claim and /register).
 *
 * Same as authMiddleware but does NOT require an existing profile in DynamoDB.
 * Used for endpoints that CREATE the user's profile.
 */
export async function firebaseOnlyAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const admin = getFirebaseAdmin();
    const isFirebaseReady = admin.apps && admin.apps.length > 0;

    let authUser: AuthUser;

    if (isDev && !isFirebaseReady) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer dev:')) {
        const parts = authHeader.replace('Bearer dev:', '').split(':');
        authUser = {
          uid: parts[0] || process.env.MOCK_USER_ID || 'mock-user-001',
          role: (parts[1] as Role) || Role.STUDENT,
          email: `${parts[0] || 'mock'}@dev.local`,
        };
      } else {
        authUser = {
          uid: process.env.MOCK_USER_ID || 'mock-user-001',
          role: Role.STUDENT,
          email: 'mock@dev.local',
        };
      }
    } else {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or malformed Authorization header');
      }
      const token = authHeader.split('Bearer ')[1];
      if (!token) throw new UnauthorizedError('Missing token');

      const decodedToken = await admin.auth().verifyIdToken(token);
      authUser = {
        uid: decodedToken.uid,
        role: Role.STUDENT, // default; will be set during claim
        email: decodedToken.email || '',
      };
    }

    (req as AuthenticatedRequest).user = authUser;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) next(error);
    else next(new UnauthorizedError('Invalid or expired authentication token'));
  }
}
