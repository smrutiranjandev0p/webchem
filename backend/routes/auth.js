const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Only return approved public fields. Never expose password or password hash.
const publicUser = (user) => ({
_id: String(user._id),
username: user.username,
email: user.email,
avatar: user.avatar,
role: user.role,
stats: user.stats,
createdAt: user.createdAt
});

router.post('/register', async (req, res) => {
try {
const { username, email, password } = req.body || {};

if (
  typeof username !== 'string' ||
  !username.trim() ||
  typeof email !== 'string' ||
  !email.trim() ||
  typeof password !== 'string' ||
  password.length < 8
) {
  return res.status(400).json({
    success: false,
    error: 'Username, valid email and a password of at least 8 characters are required.'
  });
}

const user = await User.create({
  username: username.trim(),
  email: email.trim().toLowerCase(),
  password
});

const token = generateToken(user._id);

return res.status(201).json({
  success: true,
  token,
  user: publicUser(user)
});

} catch (error) {
if (error.code === 11000) {
return res.status(409).json({
success: false,
error: 'Username or email is already registered.'
});
}

return res.status(400).json({
  success: false,
  error: 'Unable to create account with the provided details.'
});

}
});

router.post('/login', async (req, res) => {
try {
const { email, password } = req.body || {};

if (
  typeof email !== 'string' ||
  !email.trim() ||
  typeof password !== 'string' ||
  !password
) {
  return res.status(400).json({
    success: false,
    error: 'Email and password are required.'
  });
}

const user = await User.findOne({
  email: email.trim().toLowerCase()
}).select('+password');

if (!user || !(await user.comparePassword(password))) {
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials'
  });
}

const token = generateToken(user._id);

return res.json({
  success: true,
  token,
  user: publicUser(user)
});

} catch (error) {
return res.status(500).json({
success: false,
error: 'Unable to sign in right now.'
});
}
});

router.get('/me', protect, async (req, res) => {
return res.json({
success: true,
user: publicUser(req.user)
});
});

module.exports = router;
