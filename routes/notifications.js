const express = require('express');
const router = express.Router();
const db = require('../database');

// GET unread notifications
router.get('/unread', (req, res) => {
  db.all(
    `SELECT n.*, c.name as customer_name, r.upload_date 
     FROM notifications n
     LEFT JOIN customers c ON n.customer_id = c.id
     LEFT JOIN reports r ON n.report_id = r.id
     WHERE n.is_read = 0
     ORDER BY n.created_at DESC`,
    (err, rows) => {
      if (err) {
        console.error('Fehler beim Laden der Notifications:', err);
        return res.status(500).json({ error: 'Fehler beim Laden der Notifications' });
      }
      res.json(rows || []);
    }
  );
});

// GET all notifications
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  
  db.all(
    `SELECT n.*, c.name as customer_name, r.upload_date 
     FROM notifications n
     LEFT JOIN customers c ON n.customer_id = c.id
     LEFT JOIN reports r ON n.report_id = r.id
     ORDER BY n.created_at DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        console.error('Fehler beim Laden der Notifications:', err);
        return res.status(500).json({ error: 'Fehler beim Laden der Notifications' });
      }
      res.json(rows || []);
    }
  );
});

// POST mark notification as read
router.post('/:id/read', (req, res) => {
  const { id } = req.params;
  
  db.run(
    'UPDATE notifications SET is_read = 1 WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        console.error('Fehler beim Markieren der Notification:', err);
        return res.status(500).json({ error: 'Fehler beim Markieren der Notification' });
      }
      res.json({ success: true });
    }
  );
});

// POST mark all notifications as read
router.post('/read-all', (req, res) => {
  db.run(
    'UPDATE notifications SET is_read = 1 WHERE is_read = 0',
    function(err) {
      if (err) {
        console.error('Fehler beim Markieren aller Notifications:', err);
        return res.status(500).json({ error: 'Fehler beim Markieren aller Notifications' });
      }
      res.json({ success: true, updated: this.changes });
    }
  );
});

// DELETE notification
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(
    'DELETE FROM notifications WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        console.error('Fehler beim Löschen der Notification:', err);
        return res.status(500).json({ error: 'Fehler beim Löschen der Notification' });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;
