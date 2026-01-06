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
  const { name, customer_number, email, phone, address, city, postal_code, country, pdf_show_user_emails, pdf_show_user_names, pdf_show_detailed_stats, notes } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Kundenname erforderlich' });
  }
  
  db.run(
    `INSERT INTO customers (name, customer_number, email, phone, address, city, postal_code, country, pdf_show_user_emails, pdf_show_user_names, pdf_show_detailed_stats, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name.trim(), customer_number || null, email || null, phone || null, address || null, city || null, postal_code || null, country || null, 
     pdf_show_user_emails !== false ? 1 : 0, pdf_show_user_names !== false ? 1 : 0, pdf_show_detailed_stats !== false ? 1 : 0, notes || null],
    function(err) {
      if (err) {
        console.error('Fehler beim Erstellen des Kunden:', err);
        return res.status(500).json({ error: 'Kunde konnte nicht erstellt werden: ' + err.message });
      }
      
      res.json({ id: this.lastID, name: name.trim(), success: true });
    }
  );
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, customer_number, email, phone, address, city, postal_code, country, pdf_show_user_emails, pdf_show_user_names, pdf_show_detailed_stats, notes } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Kundenname erforderlich' });
  }
  
  db.run(
    `UPDATE customers SET 
      name = ?, customer_number = ?, email = ?, phone = ?, address = ?, city = ?, postal_code = ?, country = ?,
      pdf_show_user_emails = ?, pdf_show_user_names = ?, pdf_show_detailed_stats = ?, notes = ?
     WHERE id = ?`,
    [name.trim(), customer_number || null, email || null, phone || null, address || null, city || null, postal_code || null, country || null,
     pdf_show_user_emails ? 1 : 0, pdf_show_user_names ? 1 : 0, pdf_show_detailed_stats ? 1 : 0, notes || null, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Kunde konnte nicht aktualisiert werden' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Kunde nicht gefunden' });
      }
      
      res.json({ success: true });
    }
  );
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
