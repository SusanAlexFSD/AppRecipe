const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

router.get('/test', recipeController.getTestRecipes);
router.get('/', recipeController.getRecipes);
router.get('/category/:name', recipeController.getRecipesByCategory);
router.get('/:id', recipeController.getRecipeById);


// GET /api/recipes/:id - Fetch single recipe by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const recipe = await Recipe.findById(id); // Or use getRecipeById(id) if abstracted
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json({ recipe });
  } catch (error) {
    console.error('Error fetching recipe by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
