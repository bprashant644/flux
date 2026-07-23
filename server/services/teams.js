function formatMoney(v) {
  if (!v) return '₹0';
  return '₹' + Number(v).toLocaleString('en-IN');
}

function buildAdaptiveCard(userName, contacts, items = []) {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  const rows = contacts.slice(0, 10).map(c => ({
    type: 'ColumnSet',
    columns: [
      {
        type: 'Column', width: 'stretch',
        items: [{
          type: 'TextBlock',
          text: c.name,
          weight: 'Bolder',
          size: 'Small',
          wrap: true,
        }, {
          type: 'TextBlock',
          text: `${c.company || '—'} · ${c.stage}`,
          size: 'Small',
          isSubtle: true,
          spacing: 'None',
        }],
      },
      {
        type: 'Column', width: 'auto',
        items: [{
          type: 'TextBlock',
          text: formatMoney(c.value),
          weight: 'Bolder',
          size: 'Small',
          horizontalAlignment: 'Right',
        }],
      },
    ],
    separator: true,
    spacing: 'Small',
  }));

  const overflow = contacts.length > 10
    ? [{ type: 'TextBlock', text: `…and ${contacts.length - 10} more`, isSubtle: true, size: 'Small', spacing: 'Small' }]
    : [];

  const fmtDue = d => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';
  const itemSection = items.length ? [
    {
      type: 'TextBlock',
      text: `🎯 Project items due (${items.length})`,
      weight: 'Bolder',
      size: 'Small',
      spacing: 'Medium',
    },
    ...items.slice(0, 10).map(it => ({
      type: 'ColumnSet',
      columns: [
        {
          type: 'Column', width: 'stretch',
          items: [{
            type: 'TextBlock',
            text: it.title,
            weight: 'Bolder',
            size: 'Small',
            wrap: true,
          }, {
            type: 'TextBlock',
            text: `${it.project_title} · ${it.section_type}`,
            size: 'Small',
            isSubtle: true,
            spacing: 'None',
          }],
        },
        {
          type: 'Column', width: 'auto',
          items: [{
            type: 'TextBlock',
            text: fmtDue(it.due_date),
            weight: 'Bolder',
            size: 'Small',
            horizontalAlignment: 'Right',
          }],
        },
      ],
      separator: true,
      spacing: 'Small',
    })),
  ] : [];

  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      contentUrl: null,
      content: {
        $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.2',
        body: [
          {
            type: 'TextBlock',
            text: `📋 Flux — Follow-ups for ${userName}`,
            weight: 'Bolder',
            size: 'Medium',
            wrap: true,
          },
          {
            type: 'TextBlock',
            text: `You have **${contacts.length}** contact${contacts.length !== 1 ? 's' : ''} due for follow-up and **${items.length}** project item${items.length !== 1 ? 's' : ''} due today.`,
            wrap: true,
            spacing: 'Small',
            isSubtle: true,
          },
          ...rows,
          ...overflow,
          ...itemSection,
        ],
        actions: [{
          type: 'Action.OpenUrl',
          title: 'Open Reminders',
          url: `${appUrl}/reminders`,
        }],
      },
    }],
  };
}

async function postTeamsMessage(webhookUrl, userName, contacts, items = []) {
  if (!webhookUrl || (!contacts.length && !items.length)) return;
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildAdaptiveCard(userName, contacts, items)),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    console.log(`[teams] Message sent for ${userName}`);
  } catch (err) {
    console.error(`[teams] Failed to send message for ${userName}:`, err.message);
  }
}

module.exports = { postTeamsMessage, buildAdaptiveCard };
