const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.use(protect);

router.post('/molar-mass', async (req, res) => {
  const { formula } = req.body;
  res.json({ success: true, formula, molarMass: 'Calculation coming soon' });
});

router.post('/ph-calculator', async (req, res) => {
  const { concentration, type } = req.body;
  res.json({ success: true, pH: 'Calculation coming soon' });
});

module.exports = router;
