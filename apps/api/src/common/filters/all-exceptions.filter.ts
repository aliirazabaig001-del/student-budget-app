import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { ApiErrorBody } from '@skoolledger/shared';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/request-user';

const STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  423: 'Locked',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

/**
 * Produces one consistent error shape (`ApiErrorBody`) for every failure and
 * makes sure internal details (stack traces, SQL) never reach the browser.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    const body = this.toBody(exception);
    body.requestId = request.requestId;

    if (body.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl} failed [${request.requestId}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();
      const base: ApiErrorBody = {
        statusCode,
        error: STATUS_TEXT[statusCode] ?? 'Error',
        message: exception.message,
      };
      if (typeof res === 'string') return { ...base, message: res };
      if (res && typeof res === 'object') {
        const r = res as Partial<Pick<ApiErrorBody, 'code' | 'fieldErrors'>> & {
          message?: unknown;
        };
        const message = Array.isArray(r.message)
          ? r.message.join('; ')
          : typeof r.message === 'string'
            ? r.message
            : base.message;
        return {
          ...base,
          message,
          ...(r.code ? { code: r.code } : {}),
          ...(r.fieldErrors ? { fieldErrors: r.fieldErrors } : {}),
        };
      }
      return base;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const target = (exception.meta?.target as string[] | undefined) ?? [];
        const fields = target.map((t) => t.replace(/_/g, ' ')).join(', ');
        return {
          statusCode: HttpStatus.CONFLICT,
          error: STATUS_TEXT[409]!,
          message: fields ? `A record with this ${fields} already exists.` : 'Duplicate record.',
          fieldErrors: Object.fromEntries(target.map((t) => [camelCase(t), ['Already in use']])),
        };
      }
      if (exception.code === 'P2025') {
        return { statusCode: 404, error: STATUS_TEXT[404]!, message: 'Record not found' };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: STATUS_TEXT[500]!,
      message: 'Something went wrong on the server. Please try again or contact support.',
    };
  }
}

function camelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}
