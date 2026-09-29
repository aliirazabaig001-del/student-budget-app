import type { Request } from 'express';

/** The authenticated principal attached to each request by `JwtAuthGuard`. */
export interface RequestUser {
  id: string;
  schoolId: string;
  sessionId: string;
  fullName: string;
  email: string;
  username: string;
  mustChangePassword: boolean;
  roles: { key: string; name: string }[];
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: RequestUser;
  requestId?: string;
}

/** Who did something and from where. Passed from controllers to services for auditing. */
export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
}

/** Request context plus the acting user, for authenticated operations. */
export interface ActorContext extends RequestContext {
  user: RequestUser;
}
