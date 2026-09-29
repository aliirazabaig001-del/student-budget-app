# Preview sample data

`preview-data.ts` holds **fictional** records used only by module screens whose
backend is not built yet (routes marked `pending` in `src/app/navigation.ts`).
Those screens are always wrapped in `PendingModulePage`, which labels them
"UI ready — backend module pending".

Rules:

- Never import from `src/mocks` in a page that talks to the real API.
- When a module's backend lands, delete its sample data here and connect the
  page to `lib/api-client`.
