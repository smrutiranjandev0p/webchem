
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Progress = require('../models/Progress');

router.get('/', protect, async (req, res) => {
  try {
    const progress = await Progress.findOne({ user: req.user._id });

    res.json({
      success: true,
      progress: progress ? progress.state : {}
    });
  } catch (error) {
    console.error('Progress fetch failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load progress'
    });
  }
});

router.put('/', protect, async (req, res) => {
  try {
    if (
      !req.body ||
      typeof req.body.state !== 'object' ||
      req.body.state === null ||
      Array.isArray(req.body.state)
    ) {
      return res.status(400).json({
        success: false,
        error: 'A valid progress state object is required'
      });
    }

    const progress = await Progress.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          state: req.body.state,
          updatedAt: new Date()
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({
      success: true,
      progress: progress.state,
      updatedAt: progress.updatedAt
    });
  } catch (error) {
    console.error('Progress save failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to save progress'
    });
  }
});

module.exports = router;
