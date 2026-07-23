# Deploying to Render (free tier) + Neon Postgres

The app runs as a single web service: in production Express serves the built
React client and the API from one process. The database is external (Neon).

## 1. Create the database (Neon)

1. Sign up at https://neon.tech (free tier) and create a project.
2. Copy the **pooled** connection string (it looks like
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`).
3. Nothing else — the app creates and migrates its own schema on every boot
   (`server/db/migrate.js` runs all files in `server/migrations/` idempotently).

## 2. Create the web service (Render)

Option A — Blueprint: New + → Blueprint → point at this repo; `render.yaml`
defines everything. Rename the service first if you want a nicer
`*.onrender.com` URL.

Option B — manual Web Service with:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `npm install && npm --prefix client install && npm run build` |
| Start command | `node server/index.js` |
| Health check path | `/` |

Environment variables:

| Var | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | the Neon pooled connection string |
| `JWT_SECRET` | any long random string (Blueprint generates one) |
| `APP_URL` | optional — defaults to the Render URL automatically |
| `SMTP_*` | optional, only for the email digest |

`PORT` is injected by Render; the server reads it already.

## 3. Create the first admin user

After the first successful deploy, run locally (with `DATABASE_URL` set to the
Neon string):

```bash
DATABASE_URL='postgresql://…' node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
bcrypt.hash('changeme123', 10).then(hash =>
  pool.query(
    \`INSERT INTO users (name, email, password_hash, role, color)
     VALUES ('Admin User', 'admin@yourcompany.com', \$1, 'admin', '#5B5BD6')\`,
    [hash]
  ).then(() => { console.log('Admin created'); pool.end(); })
);
"
```

Then log in at your Render URL and change the password in Settings.

## Known free-tier limitations

- **Cold starts** — the free service sleeps after ~15 min idle; the first
  request after that takes ~30–60 s.
- **The 8 am digest only fires while the service is awake.** An external
  scheduler pinging the app fixes this (not set up yet).
- **HR document uploads are ephemeral.** Files are stored on local disk
  (`server/uploads/hr-docs`), and Render's free filesystem is wiped on every
  deploy/restart — uploaded HR documents WILL be lost. Metadata rows survive
  (they're in Postgres) but downloads will 404. Avoid the HR Documents upload
  feature on the free tier, or move storage to Postgres/S3 first.
- **Backups** — free tiers are thin on guarantees. Occasionally run
  `pg_dump "$DATABASE_URL" > backup.sql` somewhere safe.
