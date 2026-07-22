require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { port } = require('./config');
const migrate = require('./db/migrate');
const { startScheduler } = require('./services/scheduler');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/contacts/:id/activity', require('./routes/activity'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/custom-fields', require('./routes/customFields'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/projects/:projectId/milestones', require('./routes/projectMilestones'));
app.use('/api/projects/:projectId/items',      require('./routes/projectItems'));
app.use('/api/hr/employees',  require('./routes/hrEmployees'));
app.use('/api/hr/leaves',     require('./routes/hrLeaves'));
app.use('/api/hr/attendance', require('./routes/hrAttendance'));
app.use('/api/hr/documents',  require('./routes/hrDocuments'));
app.use('/api/hr/payroll',    require('./routes/hrPayroll'));

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

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
