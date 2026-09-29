import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS } from '@skoolledger/shared';
import { describe, expect, it } from 'vitest';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../../common/decorators/require-permissions.decorator';
import type { RequestUser } from '../../common/types/request-user';
import { PermissionsGuard } from './permissions.guard';

function contextFor(
  metadata: Record<string, unknown>,
  user?: Partial<RequestUser>,
): ExecutionContext {
  const handler = () => undefined;
  for (const [key, value] of Object.entries(metadata)) Reflect.defineMetadata(key, value, handler);
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const guard = new PermissionsGuard(new Reflector());

  it('allows routes without permission requirements', () => {
    expect(guard.canActivate(contextFor({}, { permissions: [] }))).toBe(true);
  });

  it('allows public routes even without a user', () => {
    expect(guard.canActivate(contextFor({ [IS_PUBLIC_KEY]: true }))).toBe(true);
  });

  it('allows a user holding every required permission', () => {
    const ctx = contextFor(
      { [REQUIRED_PERMISSIONS_KEY]: [PERMISSIONS.USERS_CREATE, PERMISSIONS.ROLES_ASSIGN] },
      { permissions: [PERMISSIONS.USERS_CREATE, PERMISSIONS.ROLES_ASSIGN, PERMISSIONS.USERS_READ] },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects a user missing any required permission', () => {
    const ctx = contextFor(
      { [REQUIRED_PERMISSIONS_KEY]: [PERMISSIONS.USERS_CREATE, PERMISSIONS.ROLES_ASSIGN] },
      { permissions: [PERMISSIONS.USERS_CREATE] },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects when no user is attached', () => {
    const ctx = contextFor({ [REQUIRED_PERMISSIONS_KEY]: [PERMISSIONS.USERS_READ] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
