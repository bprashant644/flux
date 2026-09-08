# Flux

A self-hosted CRM, project management, and HR tool for small to medium teams.

**Features**
- Multi-tenant: anyone can sign up and create their own organization, then invite teammates into it — no shared install between separate teams
- Contact pipeline with stages, follow-up scheduling, and activity log
- Deal tracking with multi-currency support (stored as INR, displayed in any currency)
- Project management with milestones, deliverables, tags, quadrant prioritisation, and PPC tracking
- Daily focus queue — pin due items to a "Today" plan, pull in overdue work, carry over what didn't get done
- HR module — employees, attendance, leaves (with a leave calendar), holidays, payroll, documents
- Microsoft Teams and email digest notifications
- Role-based access: Admin and Rep roles
- Per-user module access control

## Stack

- **Server** — Node.js + Express + PostgreSQL
- **Client** — React 18 + Vite
- **Auth** — JWT (stored in localStorage) + bcrypt; self-service signup with email verification when SMTP is configured (auto-verified otherwise, so a fresh install isn't stuck with no way to confirm an account)
- **Tests** — Playwright E2E

No external SaaS dependency for auth or storage — this runs entirely on Node + PostgreSQL, on infrastructure you control.

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

### 4. Create your organization
No seed script needed — start the app (next step), open it, and use **"Create an organization"** on the login screen. That first signup becomes your organization's admin. If `SMTP_*` isn't configured in `.env`, the account is verified automatically so you're not stuck waiting on an email that was never sent; configure SMTP first if you want real email verification, and again later for teammates you invite from the Users page.

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

## Deployment

See [DEPLOY.md](DEPLOY.md) for two options: a traditional Node host (Render, a VPS, etc. — persistent disk, so HR document/payroll/avatar uploads work normally) or a Vercel-compatible serverless setup (uploads won't persist there without adding your own object storage — everything else works).

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
