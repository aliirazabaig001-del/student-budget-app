import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAllPermissions } from '@skoolledger/shared';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../../common/decorators/require-permissions.decorator';
import type { AuthenticatedRequest } from '../../common/types/request-user';

/**
 * Enforces `@RequirePermissions(...)`. Runs after `JwtAuthGuard`, so the user
 * and their current permissions (loaded fresh from the database) are available.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, targets);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user || !hasAllPermissions(user.permissions, required)) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }
    return true;
  }
}
