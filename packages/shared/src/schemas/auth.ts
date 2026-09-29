import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Password policy: 10–128 characters with at least one letter and one digit.
 * Length matters far more than symbol rules, so we keep composition rules light.
 */
export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: 'Email or username is required' })
    .trim()
    .min(1, 'Email or username is required')
    .max(254)
    .transform((v) => v.toLowerCase()),
  // Do not apply the policy on login: legacy passwords must still be accepted.
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(PASSWORD_MAX_LENGTH),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(PASSWORD_MAX_LENGTH),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current password',
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
