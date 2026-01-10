const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const config = require('./config');
const db = require('./database');
const { requireAuth } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const reportRoutes = require('./routes/reports');
const emailSettingsRoutes = require('./routes/email-settings');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/customers', requireAuth, customerRoutes);
app.use('/api/reports', requireAuth, reportRoutes);
app.use('/api/email-settings', requireAuth, emailSettingsRoutes);
app.use('/api/notifications', requireAuth, notificationsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Intelego Awareness Tool is running' });
});

app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Intelego Awareness Tool running on http://localhost:${PORT}`);
  console.log(`📊 Default Login: admin / admin123`);
});
