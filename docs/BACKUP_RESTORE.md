# Backup and Restore

Everything important is in two places:

1. **The database** — users, settings, audit trail (and later students, fees,
   payments, payroll…).
2. **Uploaded files** — the school logo (and later attachments).

The backup scripts save both, verify them, and write checksums. Backups are
plain files you can copy to a USB drive, an external disk or another PC.
Nothing is sent to the internet.

> **A backup that exists only on the server is not a backup.** If the
> server's disk fails or the computer is stolen, the backup goes with it.
> Copy backups to a USB drive regularly and keep one copy off-site
> (e.g. the principal's office or home).

## Making a backup

Run in the SkoolLedger folder while SkoolLedger is running.

**Windows**

```powershell
powershell -ExecutionPolicy Bypass -File scripts\backup.ps1
# straight to a USB drive (E:)
powershell -ExecutionPolicy Bypass -File scripts\backup.ps1 -Destination E:\SkoolLedgerBackups
```

**Linux**

```bash
scripts/backup.sh
# straight to a USB drive
scripts/backup.sh /media/$USER/USB/SkoolLedgerBackups
```

Each run creates one folder, for example `backups/skoolledger-20260929-194500/`:

| File             | Contents                                                   |
| ---------------- | ---------------------------------------------------------- |
| `database.dump`  | Full PostgreSQL dump (`pg_dump` custom format, compressed) |
| `uploads.tar.gz` | Uploaded files (logo, …)                                   |
| `manifest.txt`   | Date, computer, SkoolLedger version                        |
| `SHA256SUMS`     | Checksums used to detect damaged backups                   |

What the script does:

- dumps the database with `pg_dump` inside the database container (no
  PostgreSQL tools needed on the server),
- **verifies** the dump can be read by `pg_restore`,
- archives uploaded files,
- writes the backup under a temporary name and renames it only when complete,
- deletes backups older than `BACKUP_KEEP_DAYS` (default 30) **in that folder**.

Settings in `.env`:

| Variable           | Default     | Meaning                                                |
| ------------------ | ----------- | ------------------------------------------------------ |
| `BACKUP_DIR`       | `./backups` | Default destination folder                             |
| `BACKUP_KEEP_DAYS` | `30`        | Delete older backups in the destination (0 = keep all) |

The format is identical on Windows and Linux, so a backup made on one can be
restored on the other (e.g. when replacing the server).

## Recommended schedule

| When                    | What                                                            |
| ----------------------- | --------------------------------------------------------------- |
| Every day after closing | Backup to the server's `backups` folder (automatic — see below) |
| Every Friday            | Copy the latest backup folder to a USB drive                    |
| Monthly                 | Keep one USB copy off-site; test-restore on a spare PC          |
| Before every update     | Manual backup                                                   |

### Automatic daily backup

**Windows (Task Scheduler)** — in an administrator PowerShell, adjusting the
path:

```powershell
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument '-ExecutionPolicy Bypass -File C:\SkoolLedger\scripts\backup.ps1' `
  -WorkingDirectory 'C:\SkoolLedger'
$trigger = New-ScheduledTaskTrigger -Daily -At 6pm
Register-ScheduledTask -TaskName 'SkoolLedger Backup' -Action $action -Trigger $trigger `
  -RunLevel Highest -Description 'Daily SkoolLedger backup'
```

**Linux (cron)** — `crontab -e` and add:

```
0 18 * * * cd /opt/skoolledger && scripts/backup.sh >> backups/backup.log 2>&1
```

## Restoring a backup

Restoring **replaces all current data** with the backup's data.

**Windows**

```powershell
powershell -ExecutionPolicy Bypass -File scripts\restore.ps1 -Backup E:\SkoolLedgerBackups\skoolledger-20260929-194500
```

**Linux**

```bash
scripts/restore.sh /media/$USER/USB/SkoolLedgerBackups/skoolledger-20260929-194500
```

You will be asked to type `RESTORE` to confirm (add `--yes` / `-Yes` to skip
in scripted use). The script then:

1. verifies the checksums (a damaged backup is refused before anything changes),
2. **takes a safety backup of the current data** into `BACKUP_DIR`,
3. stops the application,
4. recreates the database and restores the dump,
5. restores uploaded files,
6. starts SkoolLedger again — any newer database migrations are applied
   automatically, so an older backup can be restored into a newer version.

If you restored the wrong backup, restore the safety backup created in step 2.

After a restore, users may need to sign in again.

## Moving to a new server

1. On the old server: make a backup and copy it to USB.
2. On the new server: install SkoolLedger (docs/INSTALLATION.md). Copy the
   old `.env` over the new one **before** the first start so passwords and
   secrets match — or install fresh and restore; both work.
3. Run the restore script with the backup folder.

## Manual commands (advanced)

```bash
# Dump
docker compose exec -T db pg_dump -U skoolledger -d skoolledger -Fc > skoolledger.dump
# Inspect a dump
docker compose exec -T db pg_restore --list < skoolledger.dump | head
# Restore into an empty database
docker compose exec -T db pg_restore -U skoolledger -d skoolledger --no-owner < skoolledger.dump
```

Prefer the scripts: they also handle uploaded files, verification and the
safety backup.
