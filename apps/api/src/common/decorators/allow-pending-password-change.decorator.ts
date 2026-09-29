import { SetMetadata } from '@nestjs/common';

export const ALLOW_PENDING_PASSWORD_CHANGE_KEY = 'skoolledger:allowPendingPasswordChange';

/**
 * Users flagged with `mustChangePassword` can only call routes carrying this
 * decorator (e.g. "who am I", change password, logout) until they change it.
 */
export const AllowPendingPasswordChange = () =>
  SetMetadata(ALLOW_PENDING_PASSWORD_CHANGE_KEY, true);
