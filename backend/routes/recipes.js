const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const CategoryCache = require('../models/CategoryCache');
const recipesController = require('../controllers/recipeController.js');

router.get('/test', recipesController.testDbAndApi);
router.get('/', recipesController.getRecipes);
router.get('/category/:category', recipesController.getRecipesByCategory);
router.get('/:id', recipesController.getRecipeById);



// Helper function (clean and standalone)
function getIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure ? measure.trim() : ''} ${ingredient.trim()}`.trim());
    }
  }
  return ingredients;
}

// Temporary route to clear all caches (outside of any function)
router.delete('/clear-all-cache', async (req, res) => {
  try {
    await CategoryCache.deleteMany({});
    await Recipe.deleteMany({ title: { $exists: false } });
    res.json({ message: 'All caches cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// ✅ GET /api/recipes - Fetch recent recipes from Recipe collection
router.get('/', async (req, res) => {
  try {
    // Fixed: Query Recipe collection properly and select only recipe documents with actual data
    const recipes = await Recipe.find({ 
      apiId: { $exists: true },
      title: { $exists: true, $ne: '' },
      image: { $exists: true, $ne: '' }
    })
    .select('apiId title image instructions ingredients category')
    .limit(20)
    .lean();

    console.log('Found recipes from Recipe collection:', recipes.length);
    console.log('Sample recipe:', recipes[0]);

    // If no proper recipes in database, fetch some from API
   // If database has fewer than 100 recipes, fetch more from API
if (recipes.length < 100) {
  console.log(`Only ${recipes.length} recipes in DB, fetching more from API...`);

  const response = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php?s=');
  const meals = response.data.meals || [];

  const newRecipes = meals.map(meal => ({
    apiId: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb,
    instructions: meal.strInstructions,
    ingredients: getIngredients(meal),
    category: meal.strCategory?.toLowerCase()
  }));

  // Insert only new recipes
  await Recipe.insertMany(newRecipes, { ordered: false }).catch(err => {
    console.log('Some recipes already exist:', err.message);
  });

  return res.json(newRecipes);
}


    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Failed to fetch recipes' });
  }
});

// ✅ GET /api/recipes/category/:category
router.get('/category/:category', async (req, res) => {
  const category = req.params.category.toLowerCase();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  try {
    // Check cache first
    const cached = await CategoryCache.findOne({ category });
    
    if (cached && cached.createdAt > oneHourAgo && cached.data && cached.data.length > 0) {
      console.log('Serving from cache:', cached.data.length, 'recipes');
      console.log('Sample cached recipe:', cached.data[0]);
      
      // Validate cached data structure - check for our transformed format
      if (cached.data[0] && cached.data[0].title && cached.data[0].image && cached.data[0].apiId) {
        return res.json({ recipes: cached.data, fromCache: true });
      } else {
        console.log('Cached data is invalid format, clearing cache');
        console.log('Invalid cached recipe:', cached.data[0]);
        // Delete invalid cache
        await CategoryCache.deleteOne({ category });
      }
    }

    // Fetch from external API
    console.log('Fetching fresh data from API for category:', category);
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
    const meals = response.data.meals || [];

    console.log('API returned:', meals.length, 'meals for', category);
    console.log('Sample raw API meal:', meals[0]);

    if (meals.length === 0) {
      return res.json({ recipes: [], fromCache: false });
    }

    // CRITICAL: Transform API format to our frontend format
    const recipes = meals.map(meal => {
      const transformed = {
        apiId: meal.idMeal,
        title: meal.strMeal,
        image: meal.strMealThumb,
        category: category,
      };
      return transformed;
    });

    console.log('Transformed recipes count:', recipes.length);
    console.log('Sample transformed recipe:', recipes[0]);

    // Validate transformation worked
    if (!recipes[0] || !recipes[0].title || !recipes[0].image) {
      console.error('TRANSFORMATION FAILED!');
      console.error('Input meal:', meals[0]);
      console.error('Output recipe:', recipes[0]);
      return res.status(500).json({ message: 'Data transformation failed' });
    }

    // Cache the transformed results
    const cacheResult = await CategoryCache.findOneAndUpdate(
      { category },
      { 
        $set: { 
          data: recipes, 
          createdAt: new Date() 
        } 
      },
      { upsert: true, new: true }
    );

    console.log('Successfully cached', recipes.length, 'recipes for', category);
    console.log('Verification - cached data sample:', cacheResult.data[0]);

    // Return transformed data
    res.json({ recipes, fromCache: false });
  } catch (error) {
    console.error('Error fetching category recipes:', error);
    res.status(500).json({ message: 'Failed to fetch recipes by category' });
  }
});

// ✅ GET /api/recipes/random - Add missing random endpoint (MUST be before /:id route)
router.get('/random', async (req, res) => {
  try {
    const response = await axios.get('https://www.themealdb.com/api/json/v1/1/random.php');
    const meal = response.data.meals?.[0];
    
    if (!meal) {
      return res.status(404).json({ message: 'No random recipe found' });
    }
    
    const recipe = {
      apiId: meal.idMeal,
      title: meal.strMeal,
      image: meal.strMealThumb,
      instructions: meal.strInstructions,
      ingredients: getIngredients(meal),
      category: meal.strCategory?.toLowerCase(),
    };
    
    res.json({ recipe });
  } catch (error) {
    console.error('Error fetching random recipe:', error);
    res.status(500).json({ message: 'Failed to fetch random recipe' });
  }
});

// ✅ GET /api/recipes/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching recipe by ID:', id);

  try {
    // 1. Try DB first
    const cachedRecipe = await Recipe.findOne({ apiId: id }).lean();
    if (cachedRecipe) {
      console.log('Found recipe in DB:', cachedRecipe.title);
      return res.json({ fromCache: true, recipe: cachedRecipe });
    }

    // 2. Fetch from TheMealDB if not found in DB
    console.log('Fetching from TheMealDB API...');
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const meal = response.data.meals?.[0];
    
    if (!meal) {
      console.log('Meal not found in external API for ID:', id);
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const ingredients = getIngredients(meal);

    const newRecipe = new Recipe({
      apiId: meal.idMeal,
      title: meal.strMeal,
      image: meal.strMealThumb,
      instructions: meal.strInstructions,
      ingredients,
      category: meal.strCategory?.toLowerCase(),
    });

    console.log('Attempting to save new recipe:', newRecipe.title);

    await newRecipe.save();

    console.log('Saved new recipe:', newRecipe.title);

    return res.json({ fromCache: false, recipe: newRecipe.toObject() });

  } catch (error) {
    console.error('Error fetching recipe:', error);
    return res.status(500).json({ message: 'Failed to fetch recipe', error: error.message, error: error.message,   // <-- send error message to client
    stack: error.stack   });
  }
});




// ✅ DELETE /api/recipes/cache - Helper to clear all caches
router.delete('/cache', async (req, res) => {
  try {
    await CategoryCache.deleteMany({});
    res.json({ message: 'All caches cleared' });
  } catch (error) {
    console.error('Error clearing caches:', error);
    res.status(500).json({ message: 'Failed to clear caches' });
  }
});

module.exports = router;