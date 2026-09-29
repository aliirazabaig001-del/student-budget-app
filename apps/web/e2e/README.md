# End-to-end tests (Playwright)

The E2E suite drives a real browser through the complete Phase 1 journey
against a **running** SkoolLedger installation (Docker stack or dev servers).

```bash
# Against the Docker stack on http://localhost
E2E_ADMIN_PASSWORD='<initial admin password>' pnpm test:e2e

# Against the dev servers
E2E_BASE_URL=http://localhost:5173 E2E_ADMIN_PASSWORD='...' pnpm test:e2e
```

| Variable                         | Default               | Purpose                               |
| -------------------------------- | --------------------- | ------------------------------------- |
| `E2E_BASE_URL`                   | `http://localhost`    | Where SkoolLedger is running          |
| `E2E_ADMIN_USERNAME`             | `admin`               | Admin account to sign in with         |
| `E2E_ADMIN_PASSWORD`             | _(required)_          | The admin's initial password          |
| `E2E_ADMIN_NEW_PASSWORD`         | `E2e-admin-pass-2026` | Password set during the forced change |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE` | _(bundled)_           | Use an already-installed Chromium     |

Install the browser once with `pnpm exec playwright install chromium`.

**Use a disposable installation.** The journey changes the admin password,
school settings and logo, and creates a user.
