# SkoolLedger — Project Plan

**SkoolLedger** · _Fees • Payroll • Inventory • Accounts_

Commercial, locally installable school finance and operations software. A
school installs it on one Windows or Linux computer; staff use it from any
browser on the school network. The same code can later be hosted online.

This document records the decisions made before implementation (Phase 1), the
Phase 1 scope and acceptance checklist, and the roadmap for Milestones 2–12.

---

## 0. Repository inspection (before Phase 1)

The repository contained a small Flutter "Student Budget" prototype (≈650 lines:
`lib/`, `main.dart`, `app_state.dart`, `models.dart`, `pubspec.yaml`, …) with
in-memory data and demo login. It shares no code, data or architecture with
SkoolLedger. **It was left untouched** alongside the new monorepo and is
excluded from linting, formatting and Docker builds. It can be deleted once
you no longer need it (`git rm -r lib main.dart app_state.dart models.dart
pubspec.yaml .metadata START_WINDOWS.bat QUICK_START.md`).

---

## 1. Proposed architecture

A **modular monolith**: one NestJS API process, one React web app, one
PostgreSQL database. No microservices, message queues or external services.

```
Browser (Chrome / Edge, any PC on the school LAN)
        │  http://<server-ip>
        ▼
┌─────────────── Docker Compose on the school server ───────────────┐
│  proxy (Nginx) ── /api/* ──► api (NestJS) ──► db (PostgreSQL 16)   │
│        └────────── /*    ──► web (static React build)             │
│                             api ──► uploads volume (logos, later   │
│                                     generated PDFs)                │
└────────────────────────────────────────────────────────────────────┘
```

- **Modules** are NestJS feature modules (`auth`, `users`, `roles`,
  `permissions`, `schools`, `settings`, `audit`). Future modules (students,
  fees, payroll, …) follow the same anatomy and are registered in
  `app.module.ts`.
- **Shared contract**: `packages/shared` holds permission codes, role
  definitions, Zod validation schemas and API response types. The browser and
  server validate with the _same_ schemas — no duplicated rules.
- **Security by default**: every route requires authentication unless marked
  `@Public()`; permissions are enforced by a global guard.
- **Hosting later**: the only install-specific parts are configuration (`.env`)
  and the storage driver. Moving online means pointing `DATABASE_URL` at a
  managed PostgreSQL, enabling HTTPS/`COOKIE_SECURE`, and (optionally) adding
  an S3-compatible storage driver. No rewrite.

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 2. Folder structure

```
.
├── apps/
│   ├── api/                 NestJS API
│   │   ├── prisma/          schema.prisma + migrations
│   │   ├── src/
│   │   │   ├── common/      decorators, filters, pipes, middleware, types
│   │   │   ├── config/      validated environment configuration
│   │   │   ├── database/    Prisma service + idempotent seed
│   │   │   ├── storage/     StorageDriver abstraction + local-disk driver
│   │   │   └── modules/     auth, users, roles, permissions, schools,
│   │   │                    settings, audit, health
│   │   └── test/            integration tests (real PostgreSQL)
│   └── web/                 React + Vite app
│       ├── src/
│       │   ├── app/         router, navigation definition
│       │   ├── components/  layout shell, tables, shared page pieces
│       │   ├── features/    auth, dashboard, settings, users, audit
│       │   └── lib/         API client, query client, formatting
│       └── e2e/             Playwright end-to-end tests
├── packages/
│   ├── shared/              permissions, roles, Zod schemas, API types
│   └── ui/                  shadcn/ui-style component library
├── docker/                  Dockerfiles, Nginx configs, API entrypoint
├── scripts/                 install, backup, restore (bash + PowerShell)
├── docs/                    architecture, database, installation, backups
├── docker-compose.yml
├── .env.example
└── PROJECT_PLAN.md
```

## 3. Database schema (Phase 1)

PostgreSQL 16 via Prisma. UUID keys, snake_case tables, `timestamptz`,
foreign keys and indexes on every lookup path.

| Table              | Purpose                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| `schools`          | Tenant. Every future business table has `school_id`. Soft-deletable.                                       |
| `school_settings`  | 1:1 with school: campus, contact, currency, session, bank, IBAN, JazzCash, Easypaisa, logo key.            |
| `users`            | Belongs to a school. Argon2id hash, active flag, lockout counters, `must_change_password`. Soft-deletable. |
| `roles`            | Built-in roles (`school_id` null) and, later, custom per-school roles.                                     |
| `permissions`      | Permission catalogue (`users.create`, `settings.update`, …).                                               |
| `role_permissions` | Role ↔ permission.                                                                                         |
| `user_roles`       | User ↔ role, with who assigned it and when.                                                                |
| `sessions`         | Refresh-token sessions (hash only), rotation chain, revocation reason.                                     |
| `audit_logs`       | Append-only trail: actor, action, entity, before/after JSON, IP, user agent. Protected by a DB trigger.    |

`sessions` and `role_permissions` were added to the requested list because
secure refresh tokens and a normalised permission model need them.

Full reference and conventions: [docs/DATABASE.md](docs/DATABASE.md).

## 4. Authentication approach

- Login with **email or username** + password. Passwords hashed with
  **Argon2id** (OWASP parameters); plain text is never stored or logged.
- **Access token**: short-lived JWT (15 min, HS256, issuer/audience checked),
  kept **in memory only** in the browser (never `localStorage`).
- **Refresh token**: 256-bit random value in an `httpOnly`, `SameSite=Strict`
  cookie scoped to `/api/v1/auth`. Only its SHA-256 hash is stored.
  **Rotated on every use**; presenting an already-rotated token (outside a
  30-second multi-tab grace window) is treated as theft and ends the session.
- **Sessions are checked on every request**: roles/permissions are loaded
  fresh, so deactivating a user, changing roles or logging out takes effect
  immediately instead of when a token expires.
- **Account lockout** after 5 failed attempts (15 min), per-IP rate limiting
  on credential endpoints, timing-equalised responses for unknown users.
- **Forced password change** for new/reset accounts, enforced by the API.
- Changing a password signs out all other sessions; admin reset signs out all.

## 5. Docker / local deployment approach

- `docker compose up -d` starts **db**, **api**, **web**, **proxy**.
- Only the proxy is published (port `HTTP_PORT`, default 80). PostgreSQL is
  not reachable from the network.
- The API container applies migrations and synchronises roles/permissions on
  every start, then creates the first school + Super Admin on an empty
  database (password from `.env` or generated and printed once).
- Named volumes: `db-data` (database) and `uploads` (logos).
- Installers: `scripts/install.sh` (Linux) and `scripts/install.ps1`
  (Windows + Docker Desktop) create `.env` with random secrets and start the
  stack. Everything is configured in `.env`; nothing is hard-coded.
- Images are Alpine-based and install no OS packages, so builds only need the
  Docker and npm registries.

Details: [docs/INSTALLATION.md](docs/INSTALLATION.md).

## 6. Security considerations

| Area                 | Measure                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Passwords            | Argon2id, policy (10+ chars, letter + digit), lockout, rehash on login if parameters change                                     |
| Tokens               | In-memory access token; httpOnly/SameSite=Strict rotating refresh cookie; reuse detection                                       |
| CSRF                 | Cookie only sent to auth endpoints; those also require a custom header (blocked cross-origin)                                   |
| Authorisation        | Global JWT guard + global permission guard; deny by default                                                                     |
| Privilege escalation | Users can only grant roles / manage users whose permissions they already hold; cannot change own roles or deactivate themselves |
| Multi-tenancy        | Every query scoped by the caller's `schoolId`                                                                                   |
| Input                | Shared Zod schemas on every body/query; UUID params validated                                                                   |
| Uploads              | Size limits, type detected from file bytes (PNG/JPEG/WebP only; SVG rejected), random storage keys, path-traversal guard        |
| Headers              | Helmet on API; CSP, X-Frame-Options, nosniff, Referrer-Policy at Nginx                                                          |
| Errors               | Uniform error body with request id; no stack traces or SQL leak                                                                 |
| Audit                | Append-only (DB trigger blocks UPDATE/DELETE/TRUNCATE); secrets redacted; real client IP (spoof-resistant proxy header)         |
| Config               | Startup validation refuses missing/short/placeholder secrets                                                                    |
| Network              | DB not exposed; containers run as non-root                                                                                      |

## 7. Risks and technical concerns

1. **Plain HTTP on the LAN.** Traffic (including passwords) is unencrypted on
   the school network. Mitigation: documented HTTPS option; planned in
   Milestone 12 (installer-generated certificate or reverse proxy with a
   local CA).
2. **Single machine = single point of failure.** Disk failure loses data
   without backups. Mitigation: backup/restore scripts, USB guidance;
   scheduled backups in the installer (Milestone 12).
3. **Docker on Windows** requires Docker Desktop (WSL2), which some school PCs
   lack or cannot run (old hardware, licensing for larger organisations).
   Mitigation: documented requirements; evaluate a native Windows service
   bundle for Milestone 12.
4. **Puppeteer/Chromium** for PDF generation (Milestone 5) adds ~150 MB and
   needs fonts for Urdu/Arabic scripts. Plan: separate `reports` worker
   container or bundled Chromium, decided in Milestone 5.
5. **Money correctness.** All amounts must use `Decimal(14,2)` and
   double-entry-safe ledgers; no floating point anywhere. Conventions are
   recorded in DATABASE.md before any finance table exists.
6. **Global email/username uniqueness.** Login does not ask for a school, so
   usernames are unique per installation. Fine for one school with several
   campuses; hosted multi-school would add a school code or subdomain.
7. **Dependency versions.** Pinned to current stable majors (NestJS 11,
   Prisma 6, React 19, Vite 7, Tailwind 4, Zod 3). Upgrade deliberately, with
   the test suites, not automatically.

---

## Phase 1 scope (Milestone 1: Technical Foundation)

Built: monorepo, NestJS modules (Auth, Users, Schools, Roles, Permissions,
Settings, Audit Logs), Prisma schema + migration, JWT/refresh authentication,
five built-in roles with server-side permission guards, School Settings with
local logo storage, dashboard shell with honest placeholders, audit trail,
Docker Compose stack, backup/restore scripts, documentation and tests.

Not built (by design): any student, fee, payroll, inventory or accounting
logic. Those menu items show "Coming in next milestone".

### Completion checklist

| Requirement                  | Status | Evidence                                             |
| ---------------------------- | ------ | ---------------------------------------------------- |
| Project runs locally         | ✅     | `pnpm dev` and `docker compose up -d`                |
| PostgreSQL connects          | ✅     | `/api/v1/health` → `database: up`                    |
| Prisma migrations work       | ✅     | `prisma migrate deploy` on every container start     |
| Admin can log in             | ✅     | Integration + Playwright tests                       |
| Passwords securely hashed    | ✅     | Argon2id; asserted in tests                          |
| Protected routes work        | ✅     | Global guard; 401 tests; UI redirects                |
| Roles and permissions work   | ✅     | Per-role 403 tests, escalation tests                 |
| School settings can be saved | ✅     | API + E2E tests                                      |
| Logo can be uploaded         | ✅     | API + E2E tests (+ disguised-file rejection)         |
| Audit logs are recorded      | ✅     | Tests for every tracked action; DB immutability test |
| Docker Compose works         | ✅     | Full stack built and exercised end-to-end            |
| Backup/restore scripts exist | ✅     | Tested round-trip, checksum failure path             |
| README + installation docs   | ✅     | README.md, docs/*                                    |
| Linting passes               | ✅     | `pnpm lint`                                          |
| Type checking passes         | ✅     | `pnpm typecheck`                                     |
| Tests pass                   | ✅     | `pnpm test`, `test:integration`, `test:e2e`          |

---

## Roadmap

Each milestone ends with the same bar as Phase 1: migrations, permissions,
audit events, tests, docs, and a working Docker build. Money is never stored
as floating point; every financial change is audited.

### Milestone 2 — Student Management

Classes, sections, students (admission no., guardian, contact, status),
student search, Excel import/export (ExcelJS) with validation preview,
promotion between sessions. Permissions: `students.*`.

### Milestone 3 — Fee Heads + Fee Structure

Fee heads (tuition, admission, transport, …), fee structures per class and
session, one-time vs recurring heads, discounts/concessions/scholarships,
sibling and staff-child discounts. Permissions: `fees.*`.

### Milestone 4 — Monthly Billing

Billing runs per month/class, arrears carry-forward, late-fee rules,
adjustments with approval, idempotent re-runs, billing preview before posting.

### Milestone 5 — Crystal Reports-style Fee Voucher PDF Engine

Puppeteer + HTML/CSS templates: branded bank/school/student copies, school
logo and bank/JazzCash/Easypaisa details from Settings, barcodes/QR, bulk
generation per class, print-ready A4/legal layouts, template versioning.
The reporting engine built here is reused by later reports.

### Milestone 6 — Payments + Receipts + Student Ledger

Payment collection (cash/bank/wallet), partial payments, receipts (PDF),
student ledger with running balance, reversals with reason (never deletes),
daily collection summary. Dashboard "Fees Collected" goes live.

### Milestone 7 — Defaulters + Fee Recovery

Outstanding balances, ageing buckets, defaulter lists by class, reminder
letters/SMS-ready exports, follow-up notes. Dashboard "Outstanding Fees" live.

### Milestone 8 — Teacher/Staff Payroll + Salary Slips

Staff records, salary structures, allowances/deductions, advances and loans,
monthly payroll runs, salary slips (PDF), bank transfer sheets. Dashboard
"Salaries" live.

### Milestone 9 — Expenses + Cash + Bank

Expense categories, expense entry with attachments, approvals, cash and bank
accounts, transfers, bank reconciliation basics. Dashboard "Expenses" and
"Cash Balance" live.

### Milestone 10 — Inventory + Suppliers + Purchases

Items (books, uniforms, stationery), stock in/out, issue to students/staff,
suppliers, purchase orders, supplier payments, stock valuation. Dashboard
"Inventory Value" live.

### Milestone 11 — Financial Reports

Income & expenditure, collection reports, cash book, bank book, trial-style
summaries, payroll register, stock reports; Excel and PDF export via the
Milestone 5 engine; charts with Recharts.

### Milestone 12 — Security Review + Installer + Final Commercial Release

Independent security review, HTTPS by default, scheduled automatic backups,
update/upgrade tooling, Windows installer experience, licensing, performance
testing with realistic data, user manual, release packaging.

> Milestone 2 starts only after Phase 1 is approved.
