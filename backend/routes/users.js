const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/users/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashed });
    await newUser.save();

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/users/guest - Guest login
// Guest login route
router.post('/guest', async (req, res) => {
  try {
    // Create a unique guest username (optional: you can customize this)
    const guestUsername = `guest_${Date.now()}`;

    // Create guest user in DB
    const guestUser = new User({
      username: guestUsername,
      isGuest: true,
    });

    await guestUser.save();

    // Create JWT token for guest user
    const token = jwt.sign(
      { id: guestUser._id, isGuest: guestUser.isGuest },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      userId: guestUser._id,
      username: guestUser.username,
      isGuest: guestUser.isGuest,
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ message: 'Failed to create guest user' });
  }
});

module.exports = router;
