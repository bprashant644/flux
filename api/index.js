// Vercel serverless entry point: the whole Express app as one function.
// No app.listen()/migrate()/startScheduler() here — Vercel invokes this as a request
// handler per-request, migrations run at build time (see package.json "vercel-build"),
// and the daily digest runs via a Vercel Cron Job hitting /api/notifications/cron
// instead of the node-cron scheduler used in server/index.js's traditional entry point.
//
// This is one option among several for hosting Flux — see DEPLOY.md for Render and
// other traditional-host instructions, which don't need this file at all.
module.exports = require('../server/app');
