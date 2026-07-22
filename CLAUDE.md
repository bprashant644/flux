# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (server on :3002 + Vite on :5173 concurrently)
npm run dev

# Server only / Client only
npm run server
npm run client

# Production build (outputs to client/dist/)
npm run build

# Production run (Express serves built client + API on :3002)
NODE_ENV=production node server/index.js

# E2E tests — requires both servers running; runs serially against live DB
npm test                  # plain output
npm run test:ui           # list reporter (more readable)
npx playwright test tests/03-contacts.spec.js   # single spec file
npx playwright test --grep "Edit button"        # single test by name
```

No linter is configured. Tests are Playwright E2E only (`tests/`); no unit tests exist.

### Test setup requirements
- Both dev servers must be running (`npm run dev`)
- A test admin user must exist: `test.admin@relay-crm.test` / `TestPass123!`
- Tests share the live DB and run `workers: 1` (serial) — test data created in one test is used by later tests in the same file

To create the first admin user:
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

## Architecture

### Two-process dev setup
- **Server** (`server/`) — Node.js + Express on port 3002 (`PORT` env var)
- **Client** (`client/`) — React 18 + Vite on port 5173; Vite proxies `/api/*` → `:3002`, so all API calls use relative `/api` paths

### Server structure
- `server/index.js` — entry point: runs migrations, starts scheduler, mounts all routes
- `server/config.js` — single source of truth for env vars; import from here, not `process.env` directly
- `server/db/migrate.js` — runs all `.sql` files in `server/migrations/` in filename order on every startup (idempotent: `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`)
- `server/middleware/auth.js` — JWT verification; attaches `req.user` (`{ id, role, name, … }`)
- `server/middleware/requireAdmin.js` — role gate, used after `verifyJWT`

### Client structure
`client/src/pages/CRM.jsx` is one large file (~4300 lines) containing the entire authenticated app. All views, sub-components, and helpers live here. Navigation is `useState`-driven (`view` state), not React Router routes.

**Views** (set via `setView()`): `dashboard`, `contacts`, `deals`, `reminders`, `tasks`, `projects`, `team`, `users`, `settings`

**Key top-level components inside CRM.jsx** (in order of definition):
- `Icon`, `CurrencyInput`, `DuePill`, `StagePill`, `Avatar`, `SectionTypeBadge`, `DocTypeBadge`, `IUBadge` — shared UI primitives
- `DetailPanel` — contact detail slide-over (position:fixed, inset:0, zIndex:50 with backdrop)
- `AddContactModal`, `SettingsPage` — standalone modals
- `AddItemModal`, `AddMilestoneModal` — project item/milestone creation/editing
- `TimelineTab`, `QuadrantTab`, `OverviewTab`, `TasksTab`, `DeliverablesTab`, `FollowupsTab` — project detail tabs
- `ProjectDetail` — full project view with tabs, loaded when `activeProjectId` is set
- `ProjectsView` — project list + Today strip + dashboard mode
- `UserModal` — add/edit users
- Main `CRM` export — root component with all state and view switching

**Other client files:**
- `client/src/pages/Login.jsx` — standalone login page
- `client/src/context/AuthContext.jsx` — `{ user, login, logout, refreshUser, isAdmin, loading }` via `useAuth()`; JWT in `localStorage` under `crm_token`
- `client/src/api/index.js` — axios instance; auto-attaches Bearer token; redirects to `/login` on 401 **except** for the `/auth/login` endpoint itself (to allow displaying auth errors)

### Access control
- **Admin**: all contacts + unmasked deal values + Team view + user management
- **Rep**: all contacts but other reps' `value`/`effective_value` fields are `NULL` (masked in SQL by `contactSelect()` in `server/routes/contacts.js`); own pipeline only; no Team/Users views

### Database (PostgreSQL)

All monetary values stored as **INR integers**. Currency display conversion is client-side only via `getCurrencyConfig()` / `toDisplayAmt()`.

**Critical type gotcha:** `SUM()` of an `INTEGER` column returns `BIGINT` in PostgreSQL, which the `pg` driver returns as a JavaScript **string**. This causes string concatenation instead of arithmetic if not cast. The `effective_value` field in `contactSelect()` casts with `::float8` to prevent this. Apply the same pattern any time you aggregate numeric columns.

**Tables:**
- `users` — `role` is `'admin'` or `'rep'`; `teams_webhook_url` for MS Teams notifications
- `contacts` — `value` (INTEGER, manual deal value); `custom_fields` (JSONB); `stage` from `STAGES` constant; `next_followup` (DATE); `recurrence`
- `activity` — append-only log per contact; `type` in `('note','call','email','check','bell')`
- `deals` — linked to contacts; `stage` from `DEAL_STAGES` constant; `value` (INTEGER)
- `tasks` — standalone tasks with `due_date` and `assigned_to`
- `custom_field_defs` — admin-defined extra fields on contacts; `field_type` in `('text','number','date','select')`
- `projects` — linked optionally to one contact and/or one deal; `status` in `('active','completed','archived')`; `retro` (JSONB) for retrospective data
- `project_milestones` — ordered by `position`; items' `milestone_id` NULLs on delete
- `project_items` — `section_type` in `('task','context','deliverable','followup')`; `importance`/`urgency` (1=high, 0=low, NULL=unclassified); `committed` BOOLEAN for weekly PPC tracking; followup items have `followup_contact_id`, `recurrence`, `sync_to_crm`

**Migrations** run automatically on every server start — never edit existing migration files; add a new numbered file instead.

### API routes

| Mount | File |
|---|---|
| `/api/auth` | `routes/auth.js` |
| `/api/users` | `routes/users.js` |
| `/api/contacts` | `routes/contacts.js` |
| `/api/contacts/:id/activity` | `routes/activity.js` |
| `/api/deals` | `routes/deals.js` |
| `/api/tasks` | `routes/tasks.js` |
| `/api/custom-fields` | `routes/customFields.js` |
| `/api/notifications` | `routes/notifications.js` |
| `/api/projects` | `routes/projects.js` |
| `/api/projects/:pid/milestones` | `routes/projectMilestones.js` (mergeParams) |
| `/api/projects/:pid/items` | `routes/projectItems.js` (mergeParams) |

Projects access control: `checkAccess()` helper in each project route — reps can only access projects they `owner_id` or `created_by`. PPC (Percent Plan Complete) endpoint at `GET /api/projects/ppc` returns weekly commitment reliability data.

### CRM bridge (project follow-ups)
When a `followup` project item with `sync_to_crm=true` is marked `status='done'`, the server:
1. Clears `next_followup` on the linked contact and sets `last_contacted = CURRENT_DATE`
2. Inserts an `activity` row for the contact

The linked contact is resolved from `followup_contact_id` on the item (takes precedence) or from the project's own `contact_id`.

### Notifications
- **Email digest** — `server/services/email.js` (nodemailer); silently skipped if `SMTP_HOST` unset
- **Teams webhook** — `server/services/teams.js`; Adaptive Card to per-user `teams_webhook_url`
- **Scheduler** — `server/services/scheduler.js`; node-cron fires 8am Mon–Fri IST; contacts with `next_followup <= CURRENT_DATE` and active stage. Manual trigger: `POST /api/notifications/trigger` (admin only)
- **In-app bell** — badge/dropdown driven by already-loaded `contacts` and `tasks` state; no extra API call

### Currency system (client-side)
- All values stored as INR integers in the DB
- `getCurrencyConfig()` reads `localStorage('crm_currency')` → `{ display, rates }`
- `toDisplayAmt(v)` divides by the display currency's rate
- `fmtMoney(v)` — full formatted amount; `fmtMoneyK(v)` — compact (L/Cr for INR, K/M for others)
- `CurrencyInput` converts between display currency and INR for storage

### Key env vars (`.env`)
| Var | Purpose |
|---|---|
| `PORT` | Express port (default 3002) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Token signing key |
| `APP_URL` | Public base URL for email links / Teams buttons |
| `SMTP_*` | Email digest (all optional) |

### Playwright test patterns
- `tests/helpers.js` exports `TEST_ADMIN`, `login(page)`, `nav(page, label)`
- `login()` waits for `<aside>` to confirm successful login
- `const TS = Date.now()` at module top gives unique names per run (evaluated once per worker)
- The detail panel (slide-over) renders `position:fixed; inset:0; zIndex:50` with a full-screen backdrop — buttons behind the backdrop will show `isVisible()=true` but `click()` will be intercepted. Use `exact:true` on role queries or target elements within the panel specifically
- `effective_value` and `contacts` list API call is triggered on CRM mount (at login), not on nav click — use `page.waitForResponse(r => r.url().includes('/api/contacts') && r.status() === 200)` **before** clicking Sign in to reliably wait for contact data
