const express = require('express');
const router = express.Router();
const emailMonitor = require('../services/emailMonitor');

// Manual email check endpoint
router.post('/check-now', async (req, res) => {
  try {
    const result = await emailMonitor.checkNow();
    res.json(result);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Get monitoring status
router.get('/status', (req, res) => {
  res.json({
    isMonitoring: emailMonitor.isMonitoring()
  });
});

module.exports = router;
