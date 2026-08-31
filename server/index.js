const app = require('./app');
const { port } = require('./config');
const migrate = require('./db/migrate');
const { startScheduler } = require('./services/scheduler');

// Traditional single-process entry point — used by local dev (`npm run dev`/`npm run server`)
// and any non-serverless host (Render, a VPS, etc.). On Vercel, api/index.js exports
// server/app.js directly instead: migrations run at build time and the cron replaces
// startScheduler() there.
async function start() {
  try {
    await migrate();
    startScheduler();
    app.listen(port, () => console.log(`Flux server running on http://localhost:${port}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
