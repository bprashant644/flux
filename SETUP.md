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
# Edit .env with your database URL, JWT secret, SMTP, and optionally Graph API keys
```

## 3. Create the database
```bash
createdb flux_crm
# The app auto-runs migrations on startup — no manual SQL needed
```

## 4. Create the first admin user
```bash
node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
bcrypt.hash('changeme123', 10).then(hash =>
  pool.query(
    \`INSERT INTO users (name, email, password_hash, role, color)
     VALUES ('Admin User', 'admin@yourcompany.com', \$1, 'admin', '#5B5BD6')\`,
    [hash]
  ).then(() => { console.log('Admin created'); pool.end(); })
);
"
```

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

### Outlook Calendar sync
1. Register an app in [Azure Portal](https://portal.azure.com) → App registrations
2. Add redirect URI: `http://your-server:3001/api/calendar/callback`
3. Grant permission: Microsoft Graph → Delegated → `Calendars.ReadWrite`
4. Create a client secret
5. Fill in GRAPH_* in .env
6. Each user connects in Settings → **Connect Microsoft Account**

---

## Access control
| Role | Can do |
|---|---|
| **Admin** | See all contacts + all pipeline + deal values + Team view + user management |
| **Rep** | See all contacts (no others' deal values) · own pipeline only · no Team view |

Create rep accounts via Admin → (user management API or DB insert).
