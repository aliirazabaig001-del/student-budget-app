# Deploying SkoolLedger online (no Docker)

SkoolLedger is one Node.js process plus a PostgreSQL database. Any ordinary
Linux VPS works; no provider-specific services are required.

```
Browser ──HTTPS──▶ Nginx or Caddy ──▶ Node.js (NestJS API + built web app) ──▶ PostgreSQL
```

The web app and the API are served from the **same origin**. This keeps the
refresh cookie `SameSite=Strict` and avoids CORS, so do not host the web app
on a different domain from the API.

## 1. Server prerequisites

- Node.js 22+ and pnpm 10 (`corepack enable`)
- PostgreSQL 14+ (on the VPS or a managed PostgreSQL server)
- A domain name pointing at the server

```bash
sudo -u postgres createuser --pwprompt skoolledger
sudo -u postgres createdb -O skoolledger skoolledger
```

## 2. Build

```bash
git clone <repo> /opt/skoolledger && cd /opt/skoolledger
pnpm install --frozen-lockfile     # also generates the Prisma client
cp .env.example .env
pnpm build
```

## 3. Configure `.env`

| Variable                 | Production value                                                        |
| ------------------------ | ----------------------------------------------------------------------- |
| `NODE_ENV`               | `production`                                                            |
| `APP_URL`                | `https://app.example.com`                                               |
| `DATABASE_URL`           | `postgresql://skoolledger:<password>@localhost:5432/skoolledger`        |
| `JWT_ACCESS_SECRET`      | output of `openssl rand -hex 48`                                        |
| `WEB_DIST_DIR`           | `../web/dist` (relative to `apps/api`) or an absolute path              |
| `COOKIE_SECURE`          | `true` (HTTPS is required in production)                                |
| `TRUST_PROXY`            | `loopback` (reverse proxy on the same machine)                          |
| `STORAGE_DRIVER`         | `local` (S3-compatible storage planned)                                 |
| `UPLOAD_DIR`             | an absolute path that is backed up, e.g. `/var/lib/skoolledger/uploads` |
| `INITIAL_ADMIN_PASSWORD` | set, or leave empty to have one printed by `pnpm db:seed`               |

## 4. Database

```bash
pnpm db:deploy     # apply migrations (safe to run on every update)
pnpm db:seed       # permissions, roles, first school and admin (idempotent)
```

## 5. Run as a service

`/etc/systemd/system/skoolledger.service`:

```ini
[Unit]
Description=SkoolLedger
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/skoolledger/apps/api
ExecStart=/usr/bin/node dist/main.js
Restart=always
User=skoolledger
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now skoolledger
```

The API reads `/opt/skoolledger/.env`. It listens on `API_PORT` (3000).

## 6. HTTPS reverse proxy

Caddy (automatic free Let's Encrypt certificates):

```
app.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Or Nginx with Certbot: `proxy_pass http://127.0.0.1:3000;` with
`proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;` and
`proxy_set_header X-Forwarded-Proto $scheme;`, and `client_max_body_size 6m;`.

## 7. Updating

```bash
git pull && pnpm install --frozen-lockfile && pnpm build && pnpm db:deploy
sudo systemctl restart skoolledger
```

## Multi-school note

Every protected record is scoped by the `schoolId` of the signed-in user's
verified session; the API never trusts a school id sent by the browser. The
public sign-in branding (`/api/v1/public/branding`) currently shows the first
school; per-school sign-in addresses (subdomain or slug) are planned before
onboarding a second school.
