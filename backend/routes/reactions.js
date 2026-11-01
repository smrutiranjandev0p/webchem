const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
router.use(protect);

router.get('/', async (req, res) => {
  res.json({ success: true, message: 'Reactions endpoint - coming soon', reactions: [] });
});

module.exports = router;
