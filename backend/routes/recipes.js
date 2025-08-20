const express = require('express');
const router = express.Router();
const axios = require('axios');
const Recipe = require('../models/Recipe');
const CategoryCache = require('../models/CategoryCache');

// -------------------- Helper Functions --------------------
function getIngredients(meal) {
  const ingredients = [];
  if (!meal) return ingredients;

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim() && ingredient.trim().toLowerCase() !== 'null') {
      const measureText = (measure && measure.trim() && measure.trim().toLowerCase() !== 'null') ? measure.trim() : '';
      ingredients.push(measureText ? `${measureText} ${ingredient.trim()}`.trim() : ingredient.trim());
    }
  }
  return ingredients;
}

// ==================== IMPORTANT: SPECIFIC ROUTES MUST COME FIRST ====================

// Test route
router.get('/test', (req, res) => res.json({ message: 'Recipes route working' }));

// -------------------- Search Recipes (MUST BE BEFORE /:id) --------------------
router.get('/search', async (req, res) => {
  console.log('🔍 Search route hit with query:', req.query.q);
  
  const query = req.query.q || '';
  
  if (!query.trim()) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    console.log(`Searching for: "${query}"`);
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`, { 
      timeout: 15000 
    });
    
    const meals = response.data.meals || [];
    console.log(`Found ${meals.length} meals from API`);

    if (!meals.length) {
      return res.status(404).json({ message: 'No recipes found', recipes: [] });
    }

    const recipes = meals
      .filter(meal => {
        const hasId = meal?.idMeal;
        if (!hasId) console.warn('Meal missing idMeal:', meal?.strMeal);
        return hasId;
      })
      .map(meal => ({
        apiId: meal.idMeal,
        title: meal.strMeal || 'Untitled Recipe',
        image: meal.strMealThumb || '',
        instructions: meal.strInstructions || '',
        ingredients: getIngredients(meal),
        category: meal.strCategory?.toLowerCase() || ''
      }));

    console.log(`Processed ${recipes.length} valid recipes`);

    if (recipes.length === 0) {
      return res.status(404).json({ message: 'No valid recipes found', recipes: [] });
    }

    // Save recipes to database (optional - don't fail if this fails)
    try {
      const bulkOps = recipes.map(r => ({
        updateOne: { 
          filter: { apiId: r.apiId }, 
          update: { $set: r }, 
          upsert: true 
        }
      }));
      
      await Recipe.bulkWrite(bulkOps, { ordered: false });
      console.log('✅ Recipes saved to database');
    } catch (dbError) {
      console.warn('⚠️ Database save failed (continuing anyway):', dbError.message);
    }

    res.json(recipes);
  } catch (error) {
    console.error('❌ Search error:', error?.response?.data || error.message);

    if (error.response) {
      res.status(502).json({ 
        message: 'External API failed', 
        error: error.response.status,
        recipes: [] 
      });
    } else if (error.request) {
      res.status(504).json({ 
        message: 'No response from external API',
        recipes: [] 
      });
    } else {
      res.status(500).json({ 
        message: 'Internal server error', 
        error: error.message,
        recipes: [] 
      });
    }
  }
});

// -------------------- Category Routes (BEFORE /:id) --------------------
router.get('/category/:category', async (req, res) => {
  console.log('📂 Category route hit:', req.params.category);
  
  const category = req.params.category.toLowerCase();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  try {
    const cached = await CategoryCache.findOne({ category });
    if (cached && cached.createdAt > oneHourAgo && cached.data?.length > 0) {
      console.log('✅ Serving from cache');
      return res.json({ recipes: cached.data, fromCache: true });
    }

    console.log('🌐 Fetching from API...');
    const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`, { 
      timeout: 15000 
    });
    const meals = data.meals || [];

    const recipes = meals
      .filter(meal => meal.idMeal)
      .map(meal => ({
        apiId: meal.idMeal,
        title: meal.strMeal || 'Untitled Recipe',
        image: meal.strMealThumb || '',
        category
      }));

    await CategoryCache.findOneAndUpdate(
      { category },
      { $set: { data: recipes, createdAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ recipes, fromCache: false });
  } catch (error) {
    console.error('❌ Error fetching category recipes:', error);
    res.status(500).json({ message: 'Failed to fetch recipes by category', error: error.message });
  }
});

// Clear all caches and invalid recipes
router.delete('/clear-all-cache', async (req, res) => {
  try {
    await CategoryCache.deleteMany({});
    await Recipe.deleteMany({ title: { $exists: false } });
    res.json({ message: 'All caches cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear cache
router.delete('/cache', async (req, res) => {
  try {
    await CategoryCache.deleteMany({});
    res.json({ message: 'All caches cleared' });
  } catch (error) {
    console.error('Error clearing caches:', error);
    res.status(500).json({ message: 'Failed to clear caches', error: error.message });
  }
});

// ==================== GENERAL ROUTES (AFTER SPECIFIC ROUTES) ====================

// -------------------- Fetch Recent Recipes --------------------
router.get('/', async (req, res) => {
  console.log('📋 Root recipes route hit');

  const MIN_TARGET = 273; // TheMealDB catalogue size target (adjust if you want)
  const limit = Number(req.query.limit) || 10000;

  try {
    // how many do we actually have?
    const existingCount = await Recipe.countDocuments({
      apiId: { $exists: true },
      title: { $exists: true, $ne: '' },
      image: { $exists: true, $ne: '' },
    });

    if (existingCount < MIN_TARGET) {
      console.log(`🌱 Seeding DB (have ${existingCount}, want >= ${MIN_TARGET})...`);
      await seedAllMealsFromFirstLetters(); // defined below
    }

    // now serve everything (up to limit)
    const recipes = await Recipe.find({
      apiId: { $exists: true },
      title: { $exists: true, $ne: '' },
      image: { $exists: true, $ne: '' },
    })
      .select('apiId title image instructions ingredients category')
      .limit(limit)
      .lean();

    console.log(`✅ Serving ${recipes.length} recipes from database`);
    return res.json(recipes);
  } catch (error) {
    console.error('❌ Error fetching recipes:', error);
    res.status(500).json({ message: 'Failed to fetch recipes', error: error.message });
  }
});



async function seedAllMealsFromFirstLetters() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  // small concurrency pool to be polite to the API
  const CONCURRENCY = 4;
  const axiosOpts = { timeout: 15000 };

  const batches = [];
  for (let i = 0; i < letters.length; i += CONCURRENCY) {
    batches.push(letters.slice(i, i + CONCURRENCY));
  }

  for (const batch of batches) {
    const requests = batch.map(l =>
      axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?f=${l}`, axiosOpts)
        .then(r => r.data?.meals || [])
        .catch(e => {
          console.warn(`⚠️ Seed fetch failed for '${l}':`, e.message);
          return [];
        })
    );

    const results = await Promise.all(requests);
    const meals = results.flat();

    if (!meals.length) continue;

    const docs = meals
      .filter(m => m?.idMeal)
      .map(m => ({
        updateOne: {
          filter: { apiId: m.idMeal },
          update: {
            $set: {
              apiId: m.idMeal,
              title: m.strMeal || 'Untitled Recipe',
              image: m.strMealThumb || '',
              instructions: m.strInstructions || '',
              ingredients: getIngredients(m),
              category: m.strCategory ? m.strCategory.toLowerCase() : '',
            },
          },
          upsert: true,
        },
      }));

    if (docs.length) {
      try {
        await Recipe.bulkWrite(docs, { ordered: false });
        console.log(`➕ Seeded/updated ${docs.length} meals for batch [${batch.join(', ')}]`);
      } catch (e) {
        console.warn('⚠️ bulkWrite warnings:', e.message);
      }
    }
  }
}



// -------------------- Fetch Recipe by ID (MUST BE LAST) --------------------
// Update your /:id route in routes/recipes.js
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Recipe by ID route hit: ${id}`);

  // Skip if this looks like a search query that got misrouted
  if (id === 'search' || id.includes('=')) {
    console.log('❌ Possible misrouted search request');
    return res.status(400).json({ message: 'Invalid recipe ID format' });
  }

  try {
    let cachedRecipe;
    
    // First, try to find by apiId (for external API IDs like 52977)
    cachedRecipe = await Recipe.findOne({ apiId: id }).lean();
    
    // If not found and ID looks like MongoDB ObjectId, try finding by _id
    if (!cachedRecipe && id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('🔍 Trying to find by MongoDB _id...');
      cachedRecipe = await Recipe.findById(id).lean();
    }

    if (cachedRecipe) {
      console.log('✅ Serving recipe from cache');
      return res.json({ fromCache: true, recipe: cachedRecipe });
    }

    // If not in database, try external API (only works with numeric apiIds)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('🌐 Fetching recipe from API...');
      const { data } = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`, { 
        timeout: 15000 
      });
      const meal = data?.meals?.[0];
      
      if (!meal?.idMeal) {
        console.log(`❌ Recipe not found in API: ${id}`);
        return res.status(404).json({ message: 'Recipe not found' });
      }

      const newRecipe = new Recipe({
        apiId: meal.idMeal,
        title: meal.strMeal || 'Untitled Recipe',
        image: meal.strMealThumb || '',
        instructions: meal.strInstructions || '',
        ingredients: getIngredients(meal),
        category: meal.strCategory?.toLowerCase() || ''
      });

      await newRecipe.save();
      console.log('✅ New recipe saved to database');
      return res.json({ fromCache: false, recipe: newRecipe.toObject() });
    }

    // If we get here, the ID is a MongoDB ObjectId but not found in database
    console.log(`❌ Recipe not found: ${id}`);
    return res.status(404).json({ message: 'Recipe not found' });

  } catch (error) {
    console.error('❌ Error fetching recipe by ID:', error);
    res.status(500).json({ message: 'Failed to fetch recipe', error: error.message });
  }
});

module.exports = router;