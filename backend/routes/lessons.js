const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.use(protect);

router.get('/', async (req, res) => {
  res.json({ success: true, message: 'Lessons endpoint - coming soon', lessons: [] });
});

module.exports = router;
