import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

export const CLIENT_HEADER = 'x-skoolledger-client';

/**
 * CSRF defence for the cookie-authenticated endpoints (refresh, logout).
 * The refresh cookie is already `SameSite=Strict`; additionally requiring a
 * custom header means a cross-site form or image request can never trigger
 * these endpoints, because browsers will not add custom headers cross-origin
 * without a CORS preflight that we do not allow.
 */
@Injectable()
export class ClientHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.headers[CLIENT_HEADER]) {
      throw new ForbiddenException('Missing client header');
    }
    return true;
  }
}
