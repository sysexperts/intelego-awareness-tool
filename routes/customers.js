const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Datenbankfehler' });
    }
    res.json(customers);
  });
});

router.post('/', (req, res) => {
  const { name } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Kundenname erforderlich' });
  }
  
  db.run('INSERT INTO customers (name) VALUES (?)', [name.trim()], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Kunde konnte nicht erstellt werden' });
    }
    
    res.json({ id: this.lastID, name: name.trim(), success: true });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Kunde konnte nicht gelöscht werden' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Kunde nicht gefunden' });
    }
    
    res.json({ success: true });
  });
});

module.exports = router;
