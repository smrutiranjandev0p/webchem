const { protect } = require('./auth');

exports.requireKnowledgeAdmin = [
  protect,
  (req, res, next) => {
    const configured = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (!configured) return res.status(503).json({ success: false, error: 'Knowledge admin is not configured. Set ADMIN_EMAIL on staging.' });
    if (!req.user || String(req.user.email || '').toLowerCase() !== configured) {
      return res.status(403).json({ success: false, error: 'Knowledge administration is restricted.' });
    }
    next();
  }
];
