const { graph } = require('../config');
const pool = require('../db/pool');

async function getAccessToken(userId) {
  const { rows } = await pool.query(
    'SELECT access_token, refresh_token, expires_at FROM outlook_tokens WHERE user_id=$1',
    [userId]
  );
  if (!rows[0]) return null;

  const token = rows[0];
  // Refresh if expiring within 5 minutes
  if (new Date(token.expires_at) <= new Date(Date.now() + 5 * 60 * 1000)) {
    if (!graph.clientId) return null;
    const res = await fetch(
      `https://login.microsoftonline.com/${graph.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: graph.clientId,
          client_secret: graph.clientSecret,
          refresh_token: token.refresh_token,
          grant_type: 'refresh_token',
          scope: 'offline_access Calendars.ReadWrite',
        }),
      }
    );
    const data = await res.json();
    if (data.error) {
      console.error('[graph] Token refresh failed:', data.error_description);
      return null;
    }
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    await pool.query(
      `UPDATE outlook_tokens SET access_token=$1, refresh_token=$2, expires_at=$3 WHERE user_id=$4`,
      [data.access_token, data.refresh_token || token.refresh_token, expiresAt, userId]
    );
    return data.access_token;
  }

  return token.access_token;
}

async function createOutlookEvent(userId, contact, isoDate) {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) return;

  const start = new Date(isoDate);
  const end = new Date(isoDate);
  end.setHours(start.getHours() + 1);

  const event = {
    subject: `Follow up: ${contact.name} (${contact.company || 'No company'})`,
    body: {
      contentType: 'Text',
      content: `CRM reminder to follow up with ${contact.name} at ${contact.company || ''}.\nStage: ${contact.stage}\nNotes: ${contact.notes || '—'}`,
    },
    start: { dateTime: start.toISOString(), timeZone: 'UTC' },
    end: { dateTime: end.toISOString(), timeZone: 'UTC' },
    isReminderOn: true,
    reminderMinutesBeforeStart: 15,
    categories: ['Flux'],
  };

  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('[graph] Create event failed:', err);
      return;
    }
    console.log(`[graph] Outlook event created for ${contact.name} on ${isoDate}`);
  } catch (err) {
    console.error('[graph] createOutlookEvent error:', err.message);
  }
}

// Placeholder — production would store event IDs per contact to allow deletion
async function deleteOutlookEvent() {}

module.exports = { createOutlookEvent, deleteOutlookEvent };
