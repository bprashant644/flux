const { Pool } = require('pg');
const { databaseUrl } = require('../config');

// Hosted Postgres (Neon, Supabase, Render, …) requires SSL; local dev does not.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl);
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});
module.exports = pool;
