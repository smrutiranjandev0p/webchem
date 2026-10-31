const express = require('express');
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many AI requests. Please wait a minute and try again.' }
});

const instructions = `You are WebChem, a careful, friendly chemistry teaching assistant for students and industry learners.
Teach chemistry accurately from fundamentals through university and industrial practice.
For numerical questions: identify the given values, state the formula, convert units explicitly, substitute values, calculate, and show the final answer with units. Check dimensional consistency and significant figures. If essential data is missing, ask a concise clarification rather than inventing it.
For laboratory, QC, instrumentation, fertilizer, metallurgy and process questions: explain the principle, equipment, procedure, calculations, limitations and safety considerations where relevant. Never fabricate standards, calibration values, analytical results or operating limits. Distinguish educational approximations from validated lab or plant procedures.
Use clear headings and readable equations. Match the user's language and level. FireBot may request a shorter, warmer answer; otherwise provide a thorough tutor-style explanation. If uncertain, say what is uncertain.`;

router.post('/chat', aiLimiter, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'WebChem AI is not configured yet. Add OPENAI_API_KEY to the staging Railway service variables.'
      });
    }

    const messages = req.body && req.body.messages;
    const mode = req.body && req.body.mode === 'firebot' ? 'firebot' : 'tutor';
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) {
      return res.status(400).json({ success: false, error: 'Send between 1 and 12 conversation messages.' });
    }

    const allowed = messages.map((message) => {
      if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
        return null;
      }
      const content = message.content.trim();
      if (!content || content.length > 3000) return null;
      return { role: message.role, content };
    });

    if (allowed.some((message) => message === null) || !allowed.some((message) => message.role === 'user')) {
      return res.status(400).json({ success: false, error: 'Conversation contains an invalid message.' });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.5',
      instructions: instructions + (mode === 'firebot'
        ? '\nFor this interface, be friendly, concise and conversational. Keep useful working for calculations, but avoid long lectures unless asked.'
        : '\nFor this interface, act as a patient chemistry tutor. Explain concepts and numerical working step by step.'),
      input: allowed
    });

    const answer = response.output_text;
    if (!answer || !answer.trim()) {
      return res.status(502).json({ success: false, error: 'The AI returned an empty response. Please try again.' });
    }

    return res.json({ success: true, answer: answer.trim() });
  } catch (error) {
    console.error('WebChem AI request failed:', error.status || '', error.message || 'Unknown error');
    if (error.status === 401) {
      return res.status(503).json({ success: false, error: 'The staging OpenAI API key was rejected. Check the Railway variable.' });
    }
    if (error.status === 429) {
      return res.status(429).json({ success: false, error: 'AI usage limit reached. Please try again shortly.' });
    }
    return res.status(502).json({ success: false, error: 'WebChem AI is temporarily unavailable. Please try again.' });
  }
});

module.exports = router;
