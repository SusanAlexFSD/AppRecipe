// routes/favorites.js
const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');

// Get favorites for a user or guest
router.get('/:userId', async (req, res) => {
  const userId = req.params.userId || null;
  try {
    const favorites = await Favorite.find({ userId });
    res.json({ favorites });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Add to favorites
router.post('/add', async (req, res) => {
  const { userId = null, recipeId, recipeTitle, recipeImage } = req.body;

  if (!recipeId) {
    return res.status(400).json({ message: 'recipeId is required' });
  }

  try {
    // Prevent duplicates
    const exists = await Favorite.findOne({ userId, recipeId });
    if (exists) return res.status(409).json({ message: 'Already in favorites' });

    const newFavorite = new Favorite({ userId, recipeId, recipeTitle, recipeImage });
    await newFavorite.save();

    res.status(201).json({ message: 'Added to favorites', favorite: newFavorite });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Remove from favorites
router.delete('/remove', async (req, res) => {
  const { userId = null, recipeId } = req.body;

  if (!recipeId) {
    return res.status(400).json({ message: 'recipeId is required' });
  }

  try {
    await Favorite.findOneAndDelete({ userId, recipeId });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;