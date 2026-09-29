import { NotFoundException, ParseUUIDPipe } from '@nestjs/common';

/**
 * Route-param UUID validation. A malformed id cannot match any record, so it
 * is reported as "not found" rather than leaking parser details.
 */
export const UuidParam = new ParseUUIDPipe({
  exceptionFactory: () => new NotFoundException('Record not found'),
});
