const cron = require('node-cron');
const pool = require('../db/pool');
const { sendDigest } = require('./email');
const { postTeamsMessage } = require('./teams');

async function runDailyNotifications() {
  console.log('[scheduler] Running daily notifications...');
  try {
    // Get all users with notifications enabled
    const { rows: users } = await pool.query(
      `SELECT id, name, email, teams_webhook_url, email_digest FROM users`
    );

    for (const user of users) {
      // Contacts due today or overdue for this user
      const { rows: contacts } = await pool.query(
        `SELECT c.id, c.name, c.company, c.stage, c.value, c.next_followup
         FROM contacts c
         WHERE c.owner_id = $1
           AND c.next_followup <= CURRENT_DATE
           AND c.stage NOT IN ('won','lost')
         ORDER BY c.next_followup ASC`,
        [user.id]
      );

      // Focus queue: due/overdue project items assigned to or created by this user
      const { rows: focusItems } = await pool.query(
        `SELECT pi.id, pi.title, pi.section_type, pi.status, pi.due_date,
                p.title AS project_title
         FROM project_items pi
         JOIN projects p ON p.id = pi.project_id
         WHERE p.status = 'active'
           AND pi.section_type IN ('task','deliverable','followup')
           AND pi.status NOT IN ('done','delivered','approved')
           AND (pi.assignee_id = $1 OR pi.created_by = $1)
           AND pi.due_date IS NOT NULL
           AND pi.due_date <= CURRENT_DATE
         ORDER BY pi.due_date ASC,
                  (COALESCE(pi.urgency,0) + COALESCE(pi.importance,0)) DESC
         LIMIT 10`,
        [user.id]
      );

      if (!contacts.length && !focusItems.length) continue;

      if (user.email_digest) {
        await sendDigest(user, contacts, focusItems).catch(err =>
          console.error(`[scheduler] Email failed for ${user.email}:`, err.message)
        );
      }

      if (user.teams_webhook_url) {
        await postTeamsMessage(user.teams_webhook_url, user.name, contacts, focusItems).catch(err =>
          console.error(`[scheduler] Teams failed for ${user.name}:`, err.message)
        );
      }
    }
    console.log('[scheduler] Daily notifications complete');
  } catch (err) {
    console.error('[scheduler] Error:', err.message);
  }
}

function startScheduler() {
  // Run at 8am Mon–Fri
  cron.schedule('0 8 * * 1-5', runDailyNotifications, { timezone: 'Asia/Kolkata' });
  console.log('[scheduler] Daily digest scheduled for 8am Mon–Fri (IST)');
}

module.exports = { startScheduler, runDailyNotifications };
