import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '@skoolledger/shared';

export const REQUIRED_PERMISSIONS_KEY = 'skoolledger:requiredPermissions';

/** The caller must hold *all* listed permissions. Enforced by `PermissionsGuard`. */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
