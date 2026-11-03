const OpenAI = require('openai');
const crypto = require('crypto');
const Knowledge = require('../models/Knowledge');

let timer = null;
let busy = false;

function sourcesFrom(response) {
  const map = new Map();
  for (const item of response.output || []) for (const part of item.content || []) for (const a of part.annotations || []) {
    const url = a.url || a.url_citation?.url;
    if (!url || !/^https?:\/\//i.test(url)) continue;
    let domain = '';
    try { domain = new URL(url).hostname; } catch (_) {}
    map.set(url, { title: a.title || a.url_citation?.title || '', url, domain, publishedAt: '' });
  }
  return [...map.values()].slice(0, 12);
}

async function researchOne(topic) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const query = 'Research current, reliable chemistry knowledge for WebChem learners about: ' + topic +
    '. Prioritize authoritative scientific, government, university, standards-body and manufacturer sources. Include key facts, limitations, and safety caveats. Do not invent standards or operating limits. This is a draft for human approval.';
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.5',
    tools: [{ type: 'web_search' }],
    instructions: 'Act as a careful scientific research curator. Produce a concise note with a clear title, educational summary, important equations or definitions where relevant, limitations, and safety notes. Do not present uncertain claims as facts. The note must be reviewed by a human before use.',
    input: query
  });
  const summary = String(response.output_text || '').trim();
  if (!summary) return;
  const sources = sourcesFrom(response);
  const contentHash = crypto.createHash('sha256').update((topic + '\n' + summary).toLowerCase()).digest('hex');
  const title = summary.split('\n').map(x => x.replace(/^#+\s*/, '').trim()).find(x => x.length > 5)?.slice(0, 240) || topic;
  await Knowledge.updateOne({ contentHash }, { $setOnInsert: {
    title, topic, query, summary, sources, contentHash, status: 'pending', researchedAt: new Date()
  } }, { upsert: true });
}

async function runCycle() {
  if (busy || process.env.KNOWLEDGE_AUTO_RESEARCH !== 'true' || !process.env.OPENAI_API_KEY) return;
  busy = true;
  try {
    const topics = String(process.env.KNOWLEDGE_RESEARCH_TOPICS || 'IUPAC chemistry terminology updates|analytical chemistry instrumentation research|fertilizer and urea process research|water quality analytical methods|materials chemistry and metallurgy research')
      .split('|').map(x => x.trim()).filter(Boolean).slice(0, 12);
    if (!topics.length) return;
    const cursor = Number(process.env.KNOWLEDGE_RESEARCH_CURSOR || 0);
    const topic = topics[((Number.isFinite(cursor) ? cursor : 0) % topics.length + topics.length) % topics.length];
    await researchOne(topic);
    process.env.KNOWLEDGE_RESEARCH_CURSOR = String((cursor + 1) % topics.length);
    console.log('WebChem knowledge research draft created for:', topic);
  } catch (error) {
    console.error('WebChem scheduled knowledge research failed:', error.message);
  } finally {
    busy = false;
  }
}

function startKnowledgeScheduler() {
  if (process.env.KNOWLEDGE_AUTO_RESEARCH !== 'true') {
    console.log('WebChem scheduled knowledge research is disabled (set KNOWLEDGE_AUTO_RESEARCH=true to enable).');
    return;
  }
  const hours = Math.min(168, Math.max(24, Number(process.env.KNOWLEDGE_RESEARCH_INTERVAL_HOURS) || 24));
  const interval = hours * 60 * 60 * 1000;
  setTimeout(runCycle, 45000).unref?.();
  timer = setInterval(runCycle, interval);
  timer.unref?.();
  console.log('WebChem knowledge research scheduler enabled; interval hours:', hours);
}

module.exports = { startKnowledgeScheduler };
