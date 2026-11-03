const express = require('express');
const crypto = require('crypto');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const Knowledge = require('../models/Knowledge');
const { requireKnowledgeAdmin } = require('../middleware/knowledgeAdmin');

const router = express.Router();
router.use(requireKnowledgeAdmin);

const researchLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false });

function collectSources(response) {
  const found = new Map();
  for (const item of (response.output || [])) {
    for (const part of (item.content || [])) {
      for (const a of (part.annotations || [])) {
        const url = a.url || a.url_citation?.url;
        if (!url || !/^https?:\/\//i.test(url)) continue;
        found.set(url, { title: a.title || a.url_citation?.title || '', url, domain: (() => { try { return new URL(url).hostname; } catch (_) { return ''; } })(), publishedAt: '' });
      }
    }
  }
  return [...found.values()].slice(0, 12);
}

router.get('/status', async (req, res) => {
  const [pending, approved, rejected, latest] = await Promise.all([
    Knowledge.countDocuments({ status: 'pending' }),
    Knowledge.countDocuments({ status: 'approved' }),
    Knowledge.countDocuments({ status: 'rejected' }),
    Knowledge.findOne({ status: 'approved' }).sort({ reviewedAt: -1 }).select('title topic reviewedAt')
  ]);
  res.json({ success: true, counts: { pending, approved, rejected }, latestApproved: latest });
});

router.get('/items', async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
  const items = await Knowledge.find({ status }).sort({ researchedAt: -1 }).limit(100).lean();
  res.json({ success: true, items });
});

router.post('/research', researchLimit, async (req, res) => {
  try {
    const query = String(req.body?.query || '').trim().slice(0, 500);
    const topic = String(req.body?.topic || 'General Chemistry').trim().slice(0, 120);
    if (query.length < 8) return res.status(400).json({ success: false, error: 'Enter a specific research question (at least 8 characters).' });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ success: false, error: 'OpenAI API is not configured.' });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.5',
      tools: [{ type: 'web_search' }],
      instructions: 'You are WebChem research curator. Research the query using authoritative scientific, government, university, standards-body and manufacturer sources. Write a concise, factual educational knowledge note with title, key facts, limitations and safety caveats where relevant. Do not invent citations, standards or numerical limits. Distinguish established facts from uncertain or conflicting findings. The note is a draft for human review, never an approved operating procedure.',
      input: query
    });
    const summary = String(response.output_text || '').trim();
    if (!summary) return res.status(502).json({ success: false, error: 'Research returned no usable note.' });
    const sources = collectSources(response);
    const contentHash = crypto.createHash('sha256').update((topic + '\n' + query + '\n' + summary).toLowerCase()).digest('hex');
    const title = summary.split('\n').map(x => x.replace(/^#+\s*/, '').trim()).find(x => x.length > 5)?.slice(0, 240) || query.slice(0, 240);
    const item = await Knowledge.findOneAndUpdate(
      { contentHash },
      { $setOnInsert: { title, topic, query, summary, sources, contentHash, status: 'pending' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, item, duplicate: item.researchedAt < new Date(Date.now() - 5000) });
  } catch (error) {
    console.error('Knowledge research failed:', error.message);
    res.status(502).json({ success: false, error: 'Research failed. Please try again later.' });
  }
});

router.patch('/:id/review', async (req, res) => {
  const status = req.body?.status;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, error: 'Status must be approved or rejected.' });
  const item = await Knowledge.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, error: 'Knowledge item not found.' });
  if (item.status !== 'pending') return res.status(409).json({ success: false, error: 'Only pending items can be reviewed.' });
  item.status = status;
  item.reviewedAt = new Date();
  item.reviewedBy = req.user.email;
  item.reviewNote = String(req.body?.note || '').slice(0, 1000);
  await item.save();
  res.json({ success: true, item });
});

module.exports = router;
