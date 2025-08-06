const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

console.log('📁 Users route file loaded at:', new Date().toISOString());

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

  console.log('🔐 LOGIN ROUTE HIT!');
  console.log('📧 Email:', req.body.email);
  console.log('🔒 Password received:', !!req.body.password); // Just show if password exists
  
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    const responseData = {
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isGuest: user.isGuest
      }
    };
    
    console.log('🔍 Backend sending:', responseData); // Add this debug log
    res.json(responseData);
  } catch (err) {
    console.error('Login error:', err); // Add error logging
    res.status(500).json({ message: 'Server error during login' });
  }
});



// POST /api/users/guest - Guest login
// Guest login route
router.post('/guest', async (req, res) => {
  try {
    const guestUsername = `guest_${Date.now()}`;

    const guestUser = new User({
      username: guestUsername,
      isGuest: true,
    });

    await guestUser.save();

    const token = jwt.sign(
      { id: guestUser._id, isGuest: guestUser.isGuest },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ✅ Match structure expected by frontend
    res.json({
      token,
      user: {
        _id: guestUser._id,
        username: guestUser.username,
        isGuest: guestUser.isGuest,
      }
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ message: 'Failed to create guest user' });
  }
});


module.exports = router;