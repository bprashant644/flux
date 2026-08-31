# Deploying Flux

No manual admin-creation step for either path below — the first person to sign up via the app's "Create an organization" screen becomes an admin. This file only covers infrastructure setup.

## Option A — Traditional host (Render, a VPS, any long-running Node process)

The app runs as a single web service: in production Express serves the built React client and the API from one process, and file uploads (HR documents, payroll, avatars) go to local disk — this option is the one to pick if you need those features working.

### Render, via Blueprint
New + → Blueprint → point at your fork. `render.yaml` provisions both a Postgres instance and the web service, wiring `DATABASE_URL` between them automatically.

(Manual setup is also possible on Render or any other host — same build/start commands below, plus your own Postgres instance and its connection string in `DATABASE_URL`. Any Postgres works — Render's own, Neon, RDS, a self-managed instance, etc.)

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `npm install && npm --prefix client install --include=dev && npm run build` |
| Start command | `node server/index.js` |
| Health check path | `/` |

Nothing else — the app creates and migrates its own schema on every boot (`server/db/migrate.js` runs all files in `server/migrations/` idempotently), so a freshly provisioned database starts empty and ready.

### Environment variables
`NODE_ENV` and `DATABASE_URL` are set automatically by Render's Blueprint; set `JWT_SECRET` yourself (`openssl rand -hex 32`) — never commit it. Also available, all optional:

| Var | Purpose |
|---|---|
| `APP_URL` | Used in email links; defaults to `RENDER_EXTERNAL_URL` on Render |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Email digest, and real email verification/password-reset links — without these, signups auto-verify and forgot-password returns a clear "ask your admin" error instead of silently failing |
| `GRAPH_CLIENT_ID` / `GRAPH_CLIENT_SECRET` / `GRAPH_TENANT_ID` / `GRAPH_REDIRECT_URI` | Outlook calendar sync |

### Migrate existing data (skip for a fresh install)
```bash
pg_dump --no-owner --no-acl "$LOCAL_DATABASE_URL" > flux_dump.sql
psql "$NEW_DATABASE_URL" < flux_dump.sql
```
Do this after the web service has deployed at least once (so migrations have created the schema), then restart it.

### Known limitations on Render's free tier
- **Cold starts** — the free service sleeps after ~15 min idle; the first request after that takes ~30–60s.
- **The 8am digest only fires while the service is awake** — an external scheduler pinging the app fixes this, not set up by default.
- **Free Postgres expires after 30 days** unless upgraded.
- **Backups are thin on guarantees** — occasionally run `pg_dump "$DATABASE_URL" > backup.sql` somewhere safe.

## Option B — Vercel (serverless)

`api/index.js` + `vercel.json` wrap the same Express app as a single serverless function; `vercel-build` (in `package.json`) builds the client and runs migrations at deploy time instead of on every cold start; the daily digest runs via a Vercel Cron Job hitting `GET /api/notifications/cron` instead of the `node-cron` scheduler (which can't run in a serverless function).

1. Import your fork into Vercel. Framework preset: **Other** (this repo drives its own build via `vercel.json`).
2. Environment variables: `DATABASE_URL` (any PostgreSQL host — Neon, a managed Postgres instance, RDS, etc.; nothing here requires any particular vendor), `JWT_SECRET`, `CRON_SECRET` (any random string — Vercel automatically sends it back as `Authorization: Bearer $CRON_SECRET` on its own cron requests, which is what authenticates that endpoint), and optionally `APP_URL`/`SMTP_*`/`GRAPH_*` as above.
3. Deploy.

**Uploads don't persist on Vercel** — its filesystem is read-only except `/tmp`, which is wiped between invocations. `server/utils/uploadDir.js` keeps this from crashing the app (routes fall back to `/tmp` there instead of `server/uploads/`), but HR document/payroll/avatar files will still 404 after the function that wrote them goes cold. If you need those features, use Option A, or wire the three upload routes (`server/routes/hrDocuments.js`, `hrPayroll.js`, `users.js`) to an S3-compatible bucket yourself — they're isolated enough to swap independently of everything else.
