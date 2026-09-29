import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_ERROR_CODES } from '@skoolledger/shared';
import { ALLOW_PENDING_PASSWORD_CHANGE_KEY } from '../../../common/decorators/allow-pending-password-change.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import type { AuthenticatedRequest } from '../../../common/types/request-user';
import { PrincipalService } from '../principal.service';
import { TokenService } from '../token.service';

/**
 * Global guard: every route requires a valid access token unless marked
 * `@Public()`. Registered as an APP_GUARD so a new controller can never be
 * accidentally left unprotected.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly principals: PrincipalService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) throw new UnauthorizedException('Please sign in to continue.');
    const payload = this.tokens.verifyAccessToken(token);
    if (!payload)
      throw new UnauthorizedException('Your session has expired. Please sign in again.');

    const user = await this.principals.load(payload.sub, payload.sid);
    if (!user) throw new UnauthorizedException('Your session has ended. Please sign in again.');
    request.user = user;

    const allowPending = this.reflector.getAllAndOverride<boolean>(
      ALLOW_PENDING_PASSWORD_CHANGE_KEY,
      targets,
    );
    if (user.mustChangePassword && !allowPending) {
      throw new ForbiddenException({
        message: 'You must change your password before continuing.',
        code: API_ERROR_CODES.PASSWORD_CHANGE_REQUIRED,
      });
    }
    return true;
  }
}

export function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && value ? value : null;
}
