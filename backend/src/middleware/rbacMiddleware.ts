import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/requests';
import { Role } from '../types/enums';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Role-Based Access Control (RBAC) Middleware Factory.
 *
 * Usage:
 *   router.post('/admin/ban', authMiddleware, authorize(Role.ADMIN), banController);
 *   router.get('/mentors', authMiddleware, authorize(Role.STUDENT, Role.ALUMNI), searchMentors);
 *
 * @param allowedRoles - One or more roles that are permitted to access the route.
 * @returns Express middleware that checks req.user.role against the allowed list.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return next(new UnauthorizedError('Authentication required before authorization'));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(
        new ForbiddenError(
          `Role '${user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
}

export default authorize;
