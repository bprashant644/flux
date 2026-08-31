# Flux — Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## 1. Install dependencies
```bash
npm install
npm --prefix client install
```

## 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your database URL, JWT secret, and optionally SMTP keys
```

## 3. Create the database
```bash
createdb flux_crm
# The app auto-runs migrations on startup — no manual SQL needed
```

## 4. Create your organization
No seed script — start the app (next step), open it, and use "Create an organization" on the login screen. That first signup becomes the admin of a new organization, stored as its own row (`organizations`/`memberships`) — later signups create *separate* organizations, so this is safe for a shared/public deployment too, not just a single-team install. Without `SMTP_*` configured, the new account is verified automatically rather than left waiting on an email that can't be sent.

## 5. Start in development
```bash
npm run dev
# Server:  http://localhost:3001
# Client:  http://localhost:5173
```

## 6. Build for production
```bash
npm run build
NODE_ENV=production node server/index.js
# Serves the built React app from Express on port 3001
```

---

## Notification setup

### Email digest
Fill in SMTP_* in .env. The server sends digests at 8am Mon–Fri automatically.

### Microsoft Teams
Each user sets their own Incoming Webhook URL in **Settings** inside the app:
1. Open a Teams channel → right-click → **Connectors**
2. Add **Incoming Webhook** → copy the URL
3. Paste it in Flux → Settings → Microsoft Teams

---

## Access control
| Role | Can do |
|---|---|
| **Admin** | See all contacts + all pipeline + deal values + Team view + user management |
| **Rep** | See all contacts (no others' deal values) · own pipeline only · no Team view |

Invite teammates from the Users page — they always land in your organization, never a separate one (only the initial "Create an organization" signup creates a new org).
