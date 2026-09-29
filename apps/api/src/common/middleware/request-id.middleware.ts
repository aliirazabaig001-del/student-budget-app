import { randomUUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types/request-user';

const VALID_REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/;

/**
 * Tags every request with an id (reusing Nginx's `X-Request-Id` when present)
 * so a user-reported error can be matched to the server log line.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: AuthenticatedRequest, response: Response, next: NextFunction): void {
    const incoming = request.headers['x-request-id'];
    const requestId =
      typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);
    next();
  }
}
