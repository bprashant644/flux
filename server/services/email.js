const nodemailer = require('nodemailer');
const { smtp } = require('../config');

function createTransport() {
  if (!smtp.host) return null;
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  });
}

function formatMoney(v) {
  if (!v) return '₹0';
  return '₹' + Number(v).toLocaleString('en-IN');
}

function buildDigestHtml(user, contacts, items = []) {
  const rows = contacts.map(c => {
    const dueLabel = c.next_followup
      ? new Date(c.next_followup).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '—';
    return `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:10px 12px;font-weight:600">${c.name}</td>
        <td style="padding:10px 12px;color:#666">${c.company || '—'}</td>
        <td style="padding:10px 12px"><span style="background:#eff4ff;color:#2563eb;padding:2px 8px;border-radius:5px;font-size:12px;font-weight:600">${c.stage}</span></td>
        <td style="padding:10px 12px;font-family:monospace">${formatMoney(c.value)}</td>
        <td style="padding:10px 12px;color:#c2410c;font-weight:600">${dueLabel}</td>
      </tr>`;
  }).join('');

  return `
<!DOCTYPE html><html><body style="font-family:sans-serif;color:#19191f;background:#f4f4f6;margin:0;padding:24px">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="background:#5b5bd6;padding:24px 28px">
    <div style="color:#fff;font-size:20px;font-weight:800">Flux — Daily Follow-ups</div>
    <div style="color:rgba(255,255,255,0.75);margin-top:4px;font-size:14px">Good morning, ${user.name}. Here's who needs your attention today.</div>
  </div>
  ${contacts.length ? `
  <div style="padding:20px 0">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:2px solid #eee">
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:.05em">Contact</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:.05em">Company</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:.05em">Stage</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:.05em">Value</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:.05em">Due</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>` : ''}
  ${items.length ? `
  <div style="padding:0 0 20px">
    <div style="padding:8px 28px;font-size:13px;font-weight:800;color:#19191f">🎯 Project items due (${items.length})</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:2px solid #eee">
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:.05em">Item</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:.05em">Project</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:.05em">Type</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;letter-spacing:.05em">Due</th>
        </tr>
      </thead>
      <tbody>${items.map(it => `
        <tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:10px 12px;font-weight:600">${it.title}</td>
          <td style="padding:10px 12px;color:#666">${it.project_title}</td>
          <td style="padding:10px 12px"><span style="background:#f4f4f6;color:#555;padding:2px 8px;border-radius:5px;font-size:12px;font-weight:600">${it.section_type}</span></td>
          <td style="padding:10px 12px;color:#c2410c;font-weight:600">${it.due_date ? new Date(it.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}
  <div style="padding:16px 28px;border-top:1px solid #f0f0f0;text-align:center">
    <a href="${process.env.APP_URL || 'http://localhost:5173'}/reminders" style="background:#5b5bd6;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Open Reminders</a>
  </div>
  <div style="padding:16px 28px;color:#aaa;font-size:12px;text-align:center">Flux · Unsubscribe from digests in Settings</div>
</div>
</body></html>`;
}

async function sendDigest(user, contacts, items = []) {
  const transport = createTransport();
  if (!transport) {
    console.log('[email] SMTP not configured — skipping digest for', user.email);
    return;
  }
  if (!contacts.length && !items.length) return;

  await transport.sendMail({
    from: `"Flux" <${smtp.from}>`,
    to: user.email,
    subject: `Your focus for today (${contacts.length + items.length})`,
    html: buildDigestHtml(user, contacts, items),
  });
  console.log(`[email] Digest sent to ${user.email} (${contacts.length} contacts, ${items.length} items)`);
}

module.exports = { sendDigest };
