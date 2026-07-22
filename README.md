# Flux

A self-hosted CRM and project management tool for small sales teams.

**Features**
- Contact pipeline with stages, follow-up scheduling, and activity log
- Deal tracking with multi-currency support (stored as INR, displayed in any currency)
- Project management with milestones, deliverables, quadrant prioritisation, and PPC tracking
- HR module — employees, attendance, leaves, payroll, documents
- Microsoft Teams and email digest notifications
- Role-based access: Admin and Rep roles
- Per-user module access control

## Stack

- **Server** — Node.js + Express + PostgreSQL
- **Client** — React 18 + Vite
- **Auth** — JWT (stored in localStorage)
- **Tests** — Playwright E2E

## Quick start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Install dependencies
```bash
npm install
npm --prefix client install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET, and optionally SMTP keys
```

### 3. Create the database
```bash
createdb flux_crm
```
Migrations run automatically on first startup — no manual SQL needed.

### 4. Create the first admin user
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

### 5. Start development servers
```bash
npm run dev
# Server: http://localhost:3001
# Client: http://localhost:5173
```

### 6. Build for production
```bash
npm run build
NODE_ENV=production node server/index.js
# Serves the built client + API on port 3001
```

## Notification setup

### Email digest
Fill in `SMTP_*` in `.env`. Digests fire at 8am Mon–Fri automatically.

### Microsoft Teams
Each user sets their own Incoming Webhook URL in **Settings** inside the app.

## Access control

| Role | Permissions |
|---|---|
| **Admin** | All contacts · all deal values · Team view · user management |
| **Rep** | All contacts (others' deal values masked) · own pipeline · no Team view |

Module-level access (CRM, Projects, HR) can be configured per user by an admin.

## Running tests

Both dev servers must be running. A test admin account is required:
- Email: `test.admin@relay-crm.test`
- Password: `TestPass123!`

```bash
npm test           # all tests
npm run test:ui    # list reporter
npx playwright test tests/03-contacts.spec.js   # single file
```

## License

AGPL-3.0 — see [LICENSE](LICENSE).
