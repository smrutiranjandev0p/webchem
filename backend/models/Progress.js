
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  state: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  minimize: false
});

module.exports = mongoose.model('Progress', progressSchema);
