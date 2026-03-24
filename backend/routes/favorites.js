const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');

console.log('🔥 FAVORITES ROUTE FILE LOADED');

/* ============================================================
   DEBUG ROUTE
   ============================================================ */
router.delete('/debug-delete', (req, res) => {
  return res.json({ message: 'DELETE route works' });
});

/* ============================================================
   DELETE ALL FAVORITES
   ============================================================ */
router.delete('/clear/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('🔥 DELETE ALL ROUTE HIT for user:', userId);

  try {
    const result = await Favorite.deleteMany({ userId });

    console.log('🔥 Deleted count:', result.deletedCount);

    return res.json({
      message: 'All favorites cleared',
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error('❌ Failed to clear favorites:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});

/* ============================================================
   REMOVE A SINGLE FAVORITE
   ============================================================ */
router.delete('/remove', async (req, res) => {
  const { userId = null, recipeId } = req.body;

  if (!recipeId) {
    return res.status(400).json({ message: 'recipeId is required' });
  }

  try {
    await Favorite.findOneAndDelete({ userId, recipeId });
    return res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('❌ Failed to remove favorite:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});

/* ============================================================
   ADD TO FAVORITES
   ============================================================ */
router.post('/add', async (req, res) => {
  const { userId = null, recipeId, recipeTitle, recipeImage } = req.body;

  if (!recipeId) {
    return res.status(400).json({ message: 'recipeId is required' });
  }

  try {
    const exists = await Favorite.findOne({ userId, recipeId });

    if (exists) {
      return res.status(409).json({ message: 'Already in favorites' });
    }

    const newFavorite = new Favorite({
      userId,
      recipeId,
      recipeTitle,
      recipeImage,
    });

    await newFavorite.save();

    return res.status(201).json({
      message: 'Added to favorites',
      favorite: newFavorite,
    });
  } catch (error) {
    console.error('❌ Failed to add favorite:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});

/* ============================================================
   GET FAVORITES FOR A USER
   KEEP THIS DYNAMIC ROUTE LAST
   ============================================================ */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('📥 GET FAVORITES ROUTE HIT for user:', userId);

  try {
    const favorites = await Favorite.find({ userId });
    return res.json({ favorites });
  } catch (error) {
    console.error('❌ Failed to fetch favorites:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;