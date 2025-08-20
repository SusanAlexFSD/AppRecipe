const axios = require('axios');
const Recipe = require('../models/Recipe');
const CategoryCache = require('../models/CategoryCache');

// 🔧 Helper to extract ingredients and measures from API meal object
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

// 📦 GET /api/recipes/test - fetch test recipes or serve from Recipe cache
exports.getTestRecipes = async (req, res) => {
  try {
    const cached = await Recipe.find().limit(10);
    if (cached.length > 0) {
      return res.json({ fromCache: true, recipes: cached });
    }

    const response = await axios.get('https://www.themealdb.com/api/json/v1/1/random.php');
    const meals = response.data.meals;

    const formattedRecipes = meals.map(meal => ({
      apiId: meal.idMeal,
      title: meal.strMeal,
      image: meal.strMealThumb,
      instructions: meal.strInstructions,
      ingredients: getIngredients(meal),
    }));

    await Recipe.insertMany(formattedRecipes, { ordered: false }).catch(() => {});
    res.json({ fromCache: false, recipes: formattedRecipes });
  } catch (error) {
    console.error('Error in getTestRecipes:', error.message);
    res.status(500).json({ message: 'Failed to fetch recipes' });
  }
};

// 📦 GET /api/recipes - fetch recent recipes from Recipe collection
exports.getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ apiId: { $exists: true } })
  .limit(Number(req.query.limit) || 10000);
    res.json(recipes);
  } catch (error) {
    console.error('Error in getRecipes:', error.message);
    res.status(500).json({ message: 'Failed to load recipes' });
  }
};

// 📂 GET /api/recipes/category/:category - fetch recipes by category from CategoryCache or external API
exports.getRecipesByCategory = async (req, res) => {
  const name = req.params.category.toLowerCase();
  const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);

  try {
    const cached = await CategoryCache.findOne({ category: name });

    if (cached && cached.createdAt > oneHourAgo) {
      console.log('Serving category recipes from cache');
      return res.json({ recipes: cached.data, fromCache: true });
    }

    // Fetch from external API
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${name}`);
    const meals = response.data.meals || [];

    // Map only basic info (filter.php returns partial data)
    const validRecipes = meals.map(meal => ({
  apiId: meal.idMeal,
  title: meal.strMeal,
  image: meal.strMealThumb,
  category: name,
}));


    // Cache results
    await CategoryCache.findOneAndUpdate(
  { category: name.toLowerCase() },
  { $set: { data: validRecipes, createdAt: new Date() } },
  { upsert: true, new: true }
);

    res.json({ recipes: validRecipes, fromCache: false });
  } catch (err) {
    console.error('Failed to fetch recipes by category:', err.message);
    res.status(500).json({ message: 'Failed to fetch recipes' });
  }
};


exports.testDbAndApi = async (req, res) => {
  try {
    // Test DB find
    const testFind = await Recipe.findOne();
    console.log('Test find result:', testFind);

    // Test external API fetch
    const response = await axios.get('https://www.themealdb.com/api/json/v1/1/lookup.php?i=52977');
    const meal = response.data.meals?.[0];
    console.log('API meal:', meal ? meal.strMeal : 'No meal');

    res.json({ testFind, mealName: meal?.strMeal });
  } catch (err) {
    console.error('Test endpoint error:', err);
    res.status(500).json({ message: 'Test failed', error: err.message });
  }
};




// 📄 GET /api/recipes/:id - fetch recipe by apiId from Recipe collection or external API
exports.getRecipeById = async (req, res) => {
  const { id } = req.params;
  console.log(`Fetching recipe with ID: ${id}`);

  try {
    const cached = await Recipe.findOne({ apiId: id });
    if (cached) {
      console.log('Serving recipe from cache');
      return res.json({ fromCache: true, recipe: cached.toObject() });
    }

    console.log('Recipe not in cache, fetching from API...');
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const meal = response.data.meals?.[0];

    if (!meal) {
      console.log(`No recipe found with ID '${id}'`);
      return res.status(404).json({ message: `No recipe found with ID '${id}'` });
    }

    const newRecipe = new Recipe({
      apiId: meal.idMeal,
      title: meal.strMeal,
      image: meal.strMealThumb,
      instructions: meal.strInstructions,
      ingredients: getIngredients(meal),
      category: meal.strCategory ? meal.strCategory.toLowerCase() : undefined,
    });

    try {
      await newRecipe.save();
      console.log('New recipe saved to DB');
    } catch (saveErr) {
      console.warn('Failed to save recipe to DB:', saveErr.message);
      // Continue even if save fails
    }

    return res.json({ fromCache: false, recipe: newRecipe.toObject() });

  } catch (error) {
  console.error(`Error fetching recipe ID ${id}:`, error);
  return res.status(500).json({ message: 'Failed to get recipe by ID', error: error.message });
}

};