import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

const secret = (name: string) =>
  z
    .string({ required_error: `${name} is required` })
    .min(32, `${name} must be at least 32 characters. Generate one with: openssl rand -hex 48`)
    .refine((value) => !/change[-_ ]?me/i.test(value), {
      message: `${name} still contains the placeholder value from .env.example`,
    });

/**
 * Environment variables accepted by the API. The process refuses to start when
 * any of them is invalid, so misconfiguration is caught at install time rather
 * than as a runtime error in front of a user.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    /** Public address users open in their browser, e.g. https://app.skoolledger.com. */
    APP_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().url('APP_URL must be a full URL such as https://example.com').optional(),
    ),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    /**
     * Folder holding the built web app (apps/web/dist). When set, the API also
     * serves the web app, so one Node.js process runs all of SkoolLedger.
     * Leave empty when a reverse proxy or the Vite dev server serves it.
     */
    WEB_DIST_DIR: z.string().optional(),
    DATABASE_URL: z.string().url('DATABASE_URL must be a postgresql:// connection string'),

    JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
    JWT_ACCESS_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),

    /** Set to true when SkoolLedger is served over HTTPS. */
    COOKIE_SECURE: booleanFromString.default('false'),
    /**
     * Express "trust proxy" setting. Use `1` when running behind the bundled
     * Nginx container, `loopback` for local development.
     */
    TRUST_PROXY: z.string().default('loopback'),
    /** Comma-separated list of extra allowed origins. Empty = same-origin only. */
    CORS_ORIGINS: z.string().default(''),

    /** Where uploaded files are stored. Only `local` exists today; S3-compatible storage is planned. */
    STORAGE_DRIVER: z.enum(['local']).default('local'),
    UPLOAD_DIR: z.string().default('./uploads'),
    LOGO_MAX_BYTES: z.coerce
      .number()
      .int()
      .min(10_240)
      .max(5 * 1024 * 1024)
      .default(1024 * 1024),

    LOGIN_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(20).default(5),
    LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(30).max(10_000).default(300),
    /** Stricter per-IP limit for sign-in and password endpoints. */
    LOGIN_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(3).max(10_000).default(10),
  })
  .passthrough();

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid SkoolLedger configuration:\n${details}`);
  }
  return result.data;
}

/** Parses TRUST_PROXY into the value Express expects. */
export function parseTrustProxy(value: string): boolean | number | string {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}
