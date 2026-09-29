import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'skoolledger:isPublic';

/**
 * Marks a route as reachable without an access token.
 * Every route is protected by default; use this sparingly.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
