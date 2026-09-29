import { z } from 'zod';
import { PAGINATION } from '../constants';

/**
 * Optional free-text field. Trims input and stores blank values as `null`
 * so the database never contains empty strings for "not provided".
 */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .nullish()
    .transform((value) => (value ? value : null));

export const requiredText = (label: string, max: number) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

export const uuidSchema = z.string().uuid('Invalid identifier');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxPageSize)
    .default(PAGINATION.defaultPageSize),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
