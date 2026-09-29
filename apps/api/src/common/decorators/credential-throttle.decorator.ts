import { SetMetadata } from '@nestjs/common';

export const CREDENTIAL_ROUTE_KEY = 'skoolledger:credentialRoute';

/**
 * Applies the stricter "credentials" rate limit (LOGIN_RATE_LIMIT_PER_MINUTE)
 * to endpoints that accept a password, to slow down password guessing.
 */
export const CredentialThrottle = () => SetMetadata(CREDENTIAL_ROUTE_KEY, true);
