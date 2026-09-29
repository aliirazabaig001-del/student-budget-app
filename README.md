# SkoolLedger

**Fees • Payroll • Inventory • Accounts**

Online school finance and operations platform. Schools use it from any
browser at a public web address — nothing is installed on their computers.
Built as a clean modular monolith (React/Vite → NestJS → Prisma → PostgreSQL)
on a 100% free and open-source stack. **Docker is not required.**

> **Status: Phase 1 foundation + UI integration.** Sign-in, users, roles and
> permissions, school settings and branding, and the audit trail are live.
> Students, fees, vouchers, payments, defaulters, payroll, expenses,
> inventory, purchases, accounts and reports have finished screens marked
> **"UI ready — backend module pending"**; their backends arrive in
> Milestones 2–12 (see [PROJECT_PLAN.md](PROJECT_PLAN.md)).

---

## What works today (real API)

- **Secure sign-in** with email or username, Argon2id password hashing,
  rotating refresh tokens, account lockout and forced first-login password change.
- **Users** — create, edit, deactivate, reset passwords, assign roles.
- **Roles & permissions** — Super Admin, School Admin, Accountant, Operator,
  Viewer; enforced by the API on every request.
- **School Settings** — name, campus, contact, currency, academic session,
  bank account, IBAN, JazzCash, Easypaisa and logo upload.
- **Audit Log** — tamper-resistant record of sign-ins, sign-outs, user and
  role changes, settings changes and password changes, with before/after values
  and IP address.
- **Multi-school isolation** — every query is scoped to the signed-in user's
  school, taken from the verified session, never from the browser.
- **Dashboard** — finance figures are marked "not connected"; no sample numbers.

## Preview screens (UI only)

Module screens without a backend yet show fictional sample rows from
`apps/web/src/mocks/` inside a banner reading _"UI ready — backend module
pending"_. Their action buttons are disabled and nothing is saved.

## Run without Docker

Requirements: Node.js 22+, pnpm 10, PostgreSQL 14+.

```bash
pnpm install
cp .env.example .env    # set DATABASE_URL, JWT_ACCESS_SECRET (openssl rand -hex 48),
                        # INITIAL_ADMIN_PASSWORD (or leave empty to print one)
pnpm db:deploy          # apply migrations
pnpm db:seed            # roles, permissions, first school + admin
pnpm dev                # API :3000 + web :5173 (proxies /api) → http://localhost:5173
```

Production on one Linux VPS (single Node.js process serves API + web):

```bash
pnpm install --frozen-lockfile && pnpm build
# .env: NODE_ENV=production, WEB_DIST_DIR=../web/dist, APP_URL=https://your.domain,
#       COOKIE_SECURE=true (behind HTTPS), TRUST_PROXY=loopback
pnpm db:deploy && pnpm db:seed
pnpm start              # http://<server>:3000 — put Nginx/Caddy in front for HTTPS
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Sign in as `admin` with
`INITIAL_ADMIN_PASSWORD`; you must choose a new password at first sign-in.

Docker Compose remains available as an optional method
([docs/INSTALLATION.md](docs/INSTALLATION.md)).

## Development

### Commands

| Command                                                   | What it does                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm dev`                                                | Run shared (watch), API (watch) and web (Vite) together                                |
| `pnpm build`                                              | Build all packages                                                                     |
| `pnpm start`                                              | Start the built API (serves the web app when `WEB_DIST_DIR` is set)                    |
| `pnpm lint`                                               | ESLint across the monorepo                                                             |
| `pnpm typecheck`                                          | TypeScript in every package                                                            |
| `pnpm test`                                               | Unit tests (shared, API, web)                                                          |
| `pnpm --filter @skoolledger/api test:integration`         | API tests against a disposable PostgreSQL database                                     |
| `pnpm test:e2e`                                           | Playwright browser journey against a running install ([guide](apps/web/e2e/README.md)) |
| `pnpm format`                                             | Prettier                                                                               |
| `pnpm db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Prisma workflows                                                                       |
| `scripts/backup.sh` / `scripts/restore.sh`                | Backups ([guide](docs/BACKUP_RESTORE.md))                                              |

## Technology

| Layer      | Choice                                                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Web        | React 19, Vite 7, TypeScript, Tailwind CSS 4, shadcn/ui-style components (Radix UI), TanStack Query & Table, React Hook Form, Zod |
| API        | NestJS 11, TypeScript, Prisma 6, JWT, Argon2                                                                                      |
| Database   | PostgreSQL 16                                                                                                                     |
| Deployment | Plain Node.js + PostgreSQL on any Linux server; Docker Compose optional                                                           |
| Testing    | Vitest, Testing Library, Supertest, Playwright                                                                                    |
| Planned    | Puppeteer (PDF vouchers/reports), ExcelJS (import/export)                                                                         |

No paid services, cloud APIs or proprietary dependencies.

## Repository layout

```
apps/api         NestJS API (modules, Prisma schema, migrations, tests)
apps/web         React web app (+ Playwright E2E)
packages/shared  Permissions, roles, Zod schemas, API types (used by both)
packages/ui      Design-system components
docker/          Optional Dockerfiles and Nginx configuration
scripts/         Install, backup and restore (bash + PowerShell)
docs/            Architecture, database, installation, backup guides
```

## Documentation

- [PROJECT_PLAN.md](PROJECT_PLAN.md) — decisions, Phase 1 checklist, roadmap
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the system is built and extended
- [docs/DATABASE.md](docs/DATABASE.md) — schema, conventions, migrations
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — online deployment on a Linux VPS without Docker
- [docs/INSTALLATION.md](docs/INSTALLATION.md) — optional Docker installation
- [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md) — backups to a folder or USB drive

## Legacy files

The Flutter files at the repository root (`lib/`, `main.dart`, `app_state.dart`,
`models.dart`, `pubspec.yaml`, `QUICK_START.md`, `START_WINDOWS.bat`) belong to
an earlier, unrelated "Student Budget" prototype. They are not part of
SkoolLedger, are excluded from its tooling, and can be removed.

## License

Proprietary — all rights reserved. Third-party components are used under
their own open-source licenses.
