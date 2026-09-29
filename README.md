# SkoolLedger

**Fees • Payroll • Inventory • Accounts**

School finance and operations software that a school installs on its own
computer and uses from any browser on its network. Built as a clean modular
monolith with a 100% free and open-source stack.

> **Status: Phase 1 — Technical Foundation.** Sign-in, users, roles and
> permissions, school settings and branding, audit trail, Docker installation
> and backups are complete. Students, fees, vouchers, payroll, expenses,
> inventory and accounting arrive in Milestones 2–12
> (see [PROJECT_PLAN.md](PROJECT_PLAN.md)).

---

## What works today

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
- **Dashboard shell** with the full product navigation. Finance figures are
  clearly marked as not yet connected; no sample numbers are shown.
- **Local installation** with Docker Compose, plus backup and restore scripts.

## Quick start (school server)

Requirements: Docker Desktop (Windows) or Docker Engine + Compose (Linux).

```bash
# Linux
scripts/install.sh

# Windows (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

The installer creates `.env` with random secrets, starts SkoolLedger and prints
the address and first administrator login. Or do it by hand:

```bash
cp .env.example .env      # then set POSTGRES_PASSWORD, JWT_ACCESS_SECRET, INITIAL_ADMIN_PASSWORD
docker compose up -d
```

Open **http://localhost** on the server, or **http://&lt;server-ip&gt;** from
other computers. Full guide: [docs/INSTALLATION.md](docs/INSTALLATION.md).

### First sign-in

|          |                                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| Username | `admin` (or `INITIAL_ADMIN_USERNAME`)                                                                                  |
| Password | `INITIAL_ADMIN_PASSWORD` from `.env`; if left empty, a generated password is printed once in `docker compose logs api` |

You must choose a new password at first sign-in. Then go to **Settings** to
enter the school's details and upload its logo, and **Users** to add staff.

## Development

Requirements: Node.js 22, pnpm 10, PostgreSQL 16 (local install or
`docker compose up -d db` with a port mapping — see INSTALLATION.md).

```bash
pnpm install
cp .env.example .env          # set DATABASE_URL (localhost), secrets,
                              # NODE_ENV=development, TRUST_PROXY=loopback
pnpm db:migrate               # apply migrations to your dev database
pnpm db:seed                  # roles, permissions, first school + admin
pnpm dev                      # API on :3000, web on :5173 (proxying /api)
```

Open http://localhost:5173.

### Commands

| Command                                                   | What it does                                                                           |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `pnpm dev`                                                | Run shared (watch), API (watch) and web (Vite) together                                |
| `pnpm build`                                              | Build all packages                                                                     |
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
| Deployment | Docker, Docker Compose, Nginx                                                                                                     |
| Testing    | Vitest, Testing Library, Supertest, Playwright                                                                                    |
| Planned    | Puppeteer (PDF vouchers/reports), ExcelJS (import/export), Recharts (charts)                                                      |

No paid services, cloud APIs or proprietary dependencies.

## Repository layout

```
apps/api         NestJS API (modules, Prisma schema, migrations, tests)
apps/web         React web app (+ Playwright E2E)
packages/shared  Permissions, roles, Zod schemas, API types (used by both)
packages/ui      Design-system components
docker/          Dockerfiles and Nginx configuration
scripts/         Install, backup and restore (bash + PowerShell)
docs/            Architecture, database, installation, backup guides
```

## Documentation

- [PROJECT_PLAN.md](PROJECT_PLAN.md) — decisions, Phase 1 checklist, roadmap
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the system is built and extended
- [docs/DATABASE.md](docs/DATABASE.md) — schema, conventions, migrations
- [docs/INSTALLATION.md](docs/INSTALLATION.md) — installing, updating, troubleshooting
- [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md) — backups to a folder or USB drive

## Legacy files

The Flutter files at the repository root (`lib/`, `main.dart`, `app_state.dart`,
`models.dart`, `pubspec.yaml`, `QUICK_START.md`, `START_WINDOWS.bat`) belong to
an earlier, unrelated "Student Budget" prototype. They are not part of
SkoolLedger, are excluded from its tooling, and can be removed.

## License

Proprietary — all rights reserved. Third-party components are used under
their own open-source licenses.
