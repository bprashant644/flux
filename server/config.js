require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/flux_crm',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'crm@yourcompany.com',
  },
  graph: {
    clientId: process.env.GRAPH_CLIENT_ID,
    clientSecret: process.env.GRAPH_CLIENT_SECRET,
    tenantId: process.env.GRAPH_TENANT_ID,
    redirectUri: process.env.GRAPH_REDIRECT_URI || 'http://localhost:3001/api/calendar/callback',
  },
  appUrl: process.env.APP_URL || 'http://localhost:3001',
};
