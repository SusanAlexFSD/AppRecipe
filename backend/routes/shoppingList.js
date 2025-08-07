const express = require('express');
const router = express.Router();
const ShoppingList = require('../models/ShoppingList');

// ✅ GET shopping list for a user
router.get('/:userId', async (req, res) => {
  console.log('📥 GET /api/shoppingList/:userId called with', req.params.userId);
  try {
    const list = await ShoppingList.findOne({ userId: req.params.userId });
    if (!list) return res.status(200).json({ list: [] });
    res.json({ list: list.items });
  } catch (err) {
    console.error('❌ Failed to fetch shopping list:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// ✅ POST: add to shopping list
// ✅ POST: add recipe + ingredients to shopping list
router.post('/', async (req, res) => {
  const { userId, recipeName, ingredients } = req.body;

  if (!userId || !recipeName || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'userId, recipe name and ingredients are required' });
  }

  try {
    let list = await ShoppingList.findOne({ userId });

    if (!list) {
      list = new ShoppingList({ userId, items: [] });
    }

    const existingRecipe = list.items.find(item => item.recipeName === recipeName);

    if (existingRecipe) {
      existingRecipe.ingredients = [...new Set([...existingRecipe.ingredients, ...ingredients])];
    } else {
      list.items.push({ recipeName, ingredients });
    }

    await list.save();

    res.json({ list: list.items });
  } catch (err) {
    console.error('Failed to update shopping list:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;
