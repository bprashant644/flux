const fs = require('fs');
const os = require('os');
const path = require('path');

// multer.diskStorage() mkdirs its destination synchronously at construction time, which
// crashes the whole process on a read-only filesystem. Traditional hosts (Render, a VPS)
// have a normal persistent disk and use server/uploads/* as always; on Vercel — read-only
// except /tmp, and /tmp is wiped between invocations — this only stops the crash. Uploaded
// files genuinely won't persist there; if you need working HR-doc/payroll/avatar uploads,
// use a traditional host instead of the Vercel option (see DEPLOY.md).
function resolveUploadDir(subdir) {
  const base = process.env.VERCEL ? path.join(os.tmpdir(), 'flux-uploads') : path.join(__dirname, '../uploads');
  const dir = path.join(base, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = { resolveUploadDir };
