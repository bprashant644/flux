const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`Migrated: ${file}`);
  }
}

module.exports = migrate;

// Allows `node server/db/migrate.js` as a standalone step (used as part of the Vercel
// build command, since serverless functions must not run migrations on every cold start).
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(err => { console.error('Migration failed:', err); process.exit(1); });
}
