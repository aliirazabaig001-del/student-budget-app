import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, errorMessage } from './api-client';

/**
 * Copies server-side field errors onto a react-hook-form form. Returns the
 * general message to show when the error is not tied to specific fields.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string | null {
  if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
    let mapped = false;
    for (const [field, messages] of Object.entries(error.fieldErrors)) {
      if (field === '_root') continue;
      setError(field as Path<T>, { type: 'server', message: messages[0] });
      mapped = true;
    }
    return mapped ? null : error.message;
  }
  return errorMessage(error);
}
