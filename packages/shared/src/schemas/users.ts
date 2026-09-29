import { z } from 'zod';
import { SYSTEM_ROLE_KEYS } from '../roles';
import { paginationQuerySchema, requiredText } from './common';
import { passwordSchema } from './auth';

export const usernameSchema = z
  .string({ required_error: 'Username is required' })
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(
    /^[a-z0-9][a-z0-9._-]*$/,
    'Use lowercase letters, numbers, dots, dashes or underscores (must start with a letter or number)',
  );

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .max(254)
  .email('Enter a valid email address');

const roleKeysSchema = z
  .array(z.string().min(1).max(50))
  .min(1, 'Select at least one role')
  .max(10)
  .transform((keys) => Array.from(new Set(keys)));

/** Identity fields shared by the create and edit forms. */
export const userProfileSchema = z.object({
  fullName: requiredText('Full name', 120),
  email: emailSchema,
  username: usernameSchema,
});

export const createUserSchema = userProfileSchema.extend({
  password: passwordSchema,
  roleKeys: roleKeysSchema,
  mustChangePassword: z.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    fullName: requiredText('Full name', 120),
    email: emailSchema,
    username: usernameSchema,
    isActive: z.boolean(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Nothing to update' });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/** Edit form: profile fields plus roles (saved through two endpoints). */
export const editUserFormSchema = userProfileSchema.extend({ roleKeys: roleKeysSchema });
export type EditUserFormInput = z.infer<typeof editUserFormSchema>;

export const setUserRolesSchema = z.object({ roleKeys: roleKeysSchema });
export type SetUserRolesInput = z.infer<typeof setUserRolesSchema>;

export const resetUserPasswordSchema = z.object({
  newPassword: passwordSchema,
  mustChangePassword: z.boolean().default(true),
});
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;

export const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

/** Re-exported so forms can reference the built-in role keys. */
export { SYSTEM_ROLE_KEYS };
