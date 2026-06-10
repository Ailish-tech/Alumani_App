import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import { checkAndTransitionRole } from '../services/masterService';
import { cacheGet, cacheSet } from '../services/cacheService';

/**
 * Lazy Auto-Transition Middleware: checkGraduationStatus
 *
 * Runs on all protected routes. If the authenticated user's current role
 * is STUDENT, it checks whether the current date is past August 1st of
 * their stored gradYear.
 *
 * If the date has passed:
 * 1. Updates their role to ALUMNI in DynamoDB
 * 2. Appends X-Role-Updated: ALUMNI header to instruct the client
 *    to refresh their auth token / local state
 *
 * This is a "lazy" check — it only fires when the user actually makes
 * a request, avoiding the need for background cron jobs.
 *
 * OPTIMIZED: Results are cached in Redis for 24 hours to avoid
 * hitting DynamoDB on every single API request.
 */
export async function checkGraduationStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Only check for STUDENT role users
    const userRole = (req.user as any)?.role;
    if (userRole !== 'STUDENT') {
      return next();
    }

    const cacheKey = `graduation:checked:${req.user.uid}`;
    const alreadyChecked = await cacheGet<string>(cacheKey);

    if (alreadyChecked) {
      // Already checked recently — if it was transitioned, apply it
      if (alreadyChecked === 'ALUMNI') {
        res.setHeader('X-Role-Updated', 'ALUMNI');
        res.setHeader('X-Role-Updated-Message', 'Congratulations! You have graduated and are now an Alumni.');
        (req.user as any).role = 'ALUMNI';
      }
      return next();
    }

    const newRole = await checkAndTransitionRole(req.user.uid);

    // Cache the result for 24 hours (86400 seconds)
    await cacheSet(cacheKey, newRole || 'STUDENT', 86400);

    if (newRole) {
      // Signal the client that the role has changed
      res.setHeader('X-Role-Updated', newRole);
      res.setHeader('X-Role-Updated-Message', 'Congratulations! You have graduated and are now an Alumni.');

      // Update the request's user object for downstream handlers
      (req.user as any).role = newRole;
    }

    next();
  } catch (err) {
    // Don't block the request if the check fails — just log and continue
    console.error('[checkGraduationStatus] Error:', err);
    next();
  }
}
