# API integration tests

These tests boot the complete NestJS application (all guards, filters and HTTP
settings) and call it over HTTP against a **real PostgreSQL database**.

```bash
pnpm --filter @skoolledger/api test:integration
```

## Database

`global-setup.ts` derives a test database from `DATABASE_URL` in the repository
`.env` by appending `_test` (e.g. `skoolledger` → `skoolledger_test`), then:

1. drops and re-creates that database,
2. applies every Prisma migration (`prisma migrate deploy`),
3. seeds roles, permissions, a school and an admin,
4. drops the database again when the run finishes.

Your development database is never modified. The database user needs the
`CREATEDB` privilege (the Docker `POSTGRES_USER` has it).

To use a different server or database, set `TEST_DATABASE_URL`; the database
named in that URL is used as-is (and is dropped and re-created).

## What is covered

- Authentication: login, generic error messages, forced password change,
  refresh-token rotation, reuse (theft) detection, logout, account lockout,
  password change ending other sessions.
- Authorisation: server-side permission checks per role, anti-privilege
  escalation, immediate effect of role changes and deactivation.
- School settings: validation, persistence, logo upload/serve/remove, rejection
  of disguised non-image files.
- Audit log: entries for every tracked action, field-level diffs, redaction of
  secrets, and the database trigger that makes the table append-only.
