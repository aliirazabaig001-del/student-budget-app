# Installation

SkoolLedger runs on **one computer at the school** (the "server"). Everyone
else uses it from a browser — no software is installed on their PCs.

## 1. Choose the server computer

|         | Minimum                                                                            | Recommended     |
| ------- | ---------------------------------------------------------------------------------- | --------------- |
| CPU     | 2 cores, 64-bit                                                                    | 4 cores         |
| Memory  | 4 GB                                                                               | 8 GB            |
| Disk    | 20 GB free                                                                         | SSD, 50 GB free |
| OS      | Windows 10/11 (64-bit, with virtualization enabled) or Ubuntu 22.04+/Debian 12+    |                 |
| Network | Wired connection and a **fixed IP address** (set a DHCP reservation on the router) |                 |

The server must stay switched on while staff are working. Use a UPS if power
cuts are common.

## 2. Install Docker

- **Windows:** install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  (uses WSL 2). Open Docker Desktop once and wait until it says "running".
  In _Settings → General_, enable "Start Docker Desktop when you sign in".
- **Linux (Ubuntu/Debian):** install Docker Engine and the Compose plugin
  following <https://docs.docker.com/engine/install/>, then
  `sudo usermod -aG docker $USER` and sign out/in.

Check: `docker compose version` prints a version.

## 3. Get SkoolLedger

Copy the SkoolLedger folder to the server (e.g. `C:\SkoolLedger` or
`/opt/skoolledger`) or clone the repository there.

## 4. Install

**Windows** (PowerShell, in the SkoolLedger folder):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install.ps1
```

**Linux:**

```bash
scripts/install.sh
```

The installer asks for the school name, administrator email and web port,
creates `.env` with strong random secrets, builds and starts the containers,
and prints the addresses and first login. The first build downloads images
and packages and can take 5–15 minutes; later starts take seconds.

### Manual installation (alternative)

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable                 | Value                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_PASSWORD`      | long random value — `openssl rand -hex 24` (letters/digits only)                                                     |
| `JWT_ACCESS_SECRET`      | at least 32 random characters — `openssl rand -hex 48`                                                               |
| `INITIAL_ADMIN_PASSWORD` | first admin password (10+ chars, a letter and a number), or leave empty to have one generated and printed in the log |
| `HTTP_PORT`              | `80` (default) or another free port such as `8080`                                                                   |

Then start:

```bash
docker compose up -d
docker compose logs -f api     # watch first start; Ctrl+C to stop watching
```

## 5. First sign-in

1. On the server, open **http://localhost** (or `http://localhost:<HTTP_PORT>`).
2. Sign in with username **admin** (or `INITIAL_ADMIN_USERNAME`) and the
   initial password (from `.env`, or printed in `docker compose logs api` if
   it was generated).
3. Choose a new password when asked.
4. Remove the value of `INITIAL_ADMIN_PASSWORD` from `.env` — it is only used
   when the database is empty.
5. Open **Settings**: school name, campus, address, contact, currency,
   academic session, bank/IBAN, JazzCash/Easypaisa, and upload the logo.
6. Open **Users** and create an account for each staff member with the right
   role. Never share the admin account.

## 6. Access from other computers (LAN)

Staff open `http://<server-ip>` (e.g. `http://192.168.1.20`), adding
`:<HTTP_PORT>` if it is not 80. Find the IP with `ipconfig` (Windows) or
`hostname -I` (Linux).

- **Windows Firewall:** allow inbound TCP on the web port. In an
  administrator PowerShell:

  ```powershell
  New-NetFirewallRule -DisplayName "SkoolLedger" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -Profile Private,Domain
  ```

  Make sure the school network is set to _Private_ in Windows network settings.

- **Linux (ufw):** `sudo ufw allow 80/tcp`.
- Give the server a fixed IP (router DHCP reservation) so the address never
  changes. Bookmark it on staff PCs.

## Roles

| Role         | Can do (Phase 1)                                                              |
| ------------ | ----------------------------------------------------------------------------- |
| Super Admin  | Everything, including managing other administrators                           |
| School Admin | Users (except Super Admins), roles up to their own level, settings, audit log |
| Accountant   | Dashboard, view settings, view audit log (finance modules later)              |
| Operator     | Dashboard, view settings (data entry modules later)                           |
| Viewer       | Dashboard only                                                                |

## Day-to-day operations

| Task    | Command (in the SkoolLedger folder)                                                     |
| ------- | --------------------------------------------------------------------------------------- |
| Status  | `docker compose ps`                                                                     |
| Stop    | `docker compose stop`                                                                   |
| Start   | `docker compose up -d`                                                                  |
| Logs    | `docker compose logs --tail 200 api`                                                    |
| Back up | `scripts/backup.sh` / `scripts\backup.ps1` — see [BACKUP_RESTORE.md](BACKUP_RESTORE.md) |

With `restart: unless-stopped`, SkoolLedger starts automatically when Docker
starts after a reboot.

## Updating to a new version

1. **Back up first** (`scripts/backup.sh`).
2. Replace the application files with the new version (keep `.env`,
   `backups/` and your Docker volumes).
3. `docker compose up -d --build`

Database migrations run automatically on start. Your data lives in Docker
volumes (`skoolledger_db-data`, `skoolledger_uploads`) and is not affected by
rebuilding containers.

## HTTPS (optional, recommended)

On a trusted school LAN, HTTP is common but passwords travel unencrypted. To
enable HTTPS, add a certificate to `docker/nginx/proxy.conf` (a `listen 443
ssl` server block), publish port 443 in `docker-compose.yml`, and set
`COOKIE_SECURE=true` in `.env`. A guided HTTPS setup is planned for
Milestone 12.

## Connecting a database tool (advanced)

PostgreSQL is not published to the network. To use pgAdmin/DBeaver on the
server itself, create `docker-compose.override.yml`:

```yaml
services:
  db:
    ports:
      - '127.0.0.1:5432:5432'
```

and run `docker compose up -d`. Credentials are in `.env`. Never change data
directly in the database — use the application so changes are audited.

## Troubleshooting

| Symptom                                                          | Fix                                                                                                                                                             |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Set POSTGRES_PASSWORD in .env`                                  | `.env` is missing or incomplete — run the installer or fill it in.                                                                                              |
| API keeps restarting                                             | `docker compose logs api`. A message starting with `Invalid SkoolLedger configuration` names the bad setting (e.g. a placeholder or short `JWT_ACCESS_SECRET`). |
| Port 80 already in use                                           | Set `HTTP_PORT=8080` in `.env`, then `docker compose up -d`. Use `http://<ip>:8080`.                                                                            |
| Other PCs cannot connect                                         | Check firewall rule, network profile (Private), and that both PCs are on the same network. Try `http://<ip>/api/v1/health` from the other PC.                   |
| "Account temporarily locked"                                     | Wait 15 minutes (`LOGIN_LOCK_MINUTES`) or ask an admin to reset the password.                                                                                   |
| Forgot the only admin password                                   | Ask another Super Admin to reset it. Always keep a second Super Admin account. (A command-line recovery tool is planned for Milestone 12.)                      |
| Changed `POSTGRES_PASSWORD` after install and API cannot connect | The database keeps its original password. Put the original back in `.env`.                                                                                      |

## Uninstall

`docker compose down` stops and removes containers but **keeps data**.
`docker compose down -v` also **deletes all data** — back up first.
