const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: function(){ return !this.googleId; }, select: false },
  passwordIsHashed: { type: Boolean, default: false, select: false },
  googleId: { type: String, unique: true, sparse: true },
  emailVerified: { type: Boolean, default: true },
  avatar: { type: String },
  role: { type: String, enum: ['student', 'educator', 'admin'], default: 'student' },
  stats: {
    lessonsCompleted: { type: Number, default: 0 },
    quizzesCompleted: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  if (this.passwordIsHashed) { this.passwordIsHashed = false; return next(); }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
