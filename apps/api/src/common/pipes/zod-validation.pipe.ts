import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodError, ZodTypeAny, z } from 'zod';

/** Converts a ZodError into `{ "field.path": ["message", ...] }`. */
export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_root';
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}

/**
 * Validates and transforms input with a shared Zod schema, so the exact same
 * rules run in the browser form and on the server.
 *
 * Usage: `@Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput`
 */
@Injectable()
export class ZodValidationPipe<TSchema extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Some fields are invalid. Please correct them and try again.',
        fieldErrors: zodFieldErrors(result.error),
      });
    }
    return result.data;
  }
}
