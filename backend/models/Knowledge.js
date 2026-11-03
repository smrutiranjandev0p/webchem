const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 240 },
  topic: { type: String, required: true, trim: true, maxlength: 120 },
  query: { type: String, required: true, maxlength: 500 },
  summary: { type: String, required: true, maxlength: 18000 },
  sources: [{
    title: { type: String, default: '' },
    url: { type: String, required: true },
    domain: { type: String, default: '' },
    publishedAt: { type: String, default: '' }
  }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  contentHash: { type: String, required: true, unique: true },
  researchedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: String, default: '' },
  reviewNote: { type: String, default: '', maxlength: 1000 }
}, { timestamps: true });

knowledgeSchema.index({ status: 1, topic: 1, researchedAt: -1 });
knowledgeSchema.index({ title: 'text', summary: 'text', topic: 'text' });

module.exports = mongoose.model('Knowledge', knowledgeSchema);
