const express = require('express');
const router = express.Router();
const ShoppingList = require('../models/ShoppingList');

// ✅ GET shopping list for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const list = await ShoppingList.findOne({ userId });

    if (!list) {
      return res.status(200).json({ list: [] }); // Return empty list if not found
    }

    res.json({ list: list.items });
  } catch (err) {
    console.error('Failed to fetch shopping list:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// ✅ POST: add to shopping list
router.post('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }

  try {
    const list = await ShoppingList.findOneAndUpdate(
      { userId },
      { $addToSet: { items: { $each: items } } },
      { upsert: true, new: true }
    );

    res.json({ list: list.items });
  } catch (err) {
    console.error('Failed to update shopping list:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
