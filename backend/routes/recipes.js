const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const CategoryCache = require('../models/CategoryCache');

// Helper function to extract ingredients from external API
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

  // Add this route temporarily
router.delete('/clear-all-cache', async (req, res) => {
  try {
    await CategoryCache.deleteMany({});
    await Recipe.deleteMany({ title: { $exists: false } });
    res.json({ message: 'All caches cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
}

// ✅ GET /api/recipes/test
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working!' });
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
    if (recipes.length === 0) {
      console.log('No recipes in database, fetching from API...');
      
      const response = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php?s=');
      const meals = response.data.meals?.slice(0, 10) || [];
      
      const newRecipes = meals.map(meal => ({
        apiId: meal.idMeal,
        title: meal.strMeal,
        image: meal.strMealThumb,
        instructions: meal.strInstructions,
        ingredients: getIngredients(meal),
        category: meal.strCategory?.toLowerCase()
      }));

      // Save to database
      if (newRecipes.length > 0) {
        await Recipe.insertMany(newRecipes, { ordered: false }).catch(err => {
          console.log('Some recipes may already exist:', err.message);
        });
      }

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
  
  try {
    // First, try to fetch from local DB
    const recipe = await Recipe.findOne({ apiId: id }).lean();
    if (recipe) {
      console.log('Found recipe in database:', recipe.title);
      return res.json({ fromCache: true, recipe });
    }

    // Otherwise, fetch from external API
    console.log('Fetching recipe from API:', id);
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const meal = response.data.meals?.[0];
    
    if (!meal) {
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

    await newRecipe.save();
    console.log('Saved new recipe:', newRecipe.title);

    res.json({ fromCache: false, recipe: newRecipe.toObject() });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'Failed to fetch recipe' });
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