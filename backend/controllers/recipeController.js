const axios = require('axios');
const Recipe = require('../models/Recipe');

// 📦 /api/recipes/test
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

// 📦 /api/recipes
exports.getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find().limit(20);
    res.json(recipes);
  } catch (error) {
    console.error('Error in getRecipes:', error.message);
    res.status(500).json({ message: 'Failed to load recipes' });
  }
};

// 📂 /api/recipes/category/:name
exports.getRecipesByCategory = async (req, res) => {
  const { name } = req.params;

  try {
    const cached = await Recipe.findOne({ category: name });
    if (cached) {
      return res.json({ fromCache: true, recipes: cached.data });
    }

    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${name}`);
    const meals = response.data.meals;

    if (!meals) {
      return res.status(404).json({ message: `No meals found for category '${name}'` });
    }

    const newEntry = new Recipe({
      category: name,
      data: meals,
      ingredients: [],
    });

    await newEntry.save();

    res.json({ fromCache: false, recipes: meals });
  } catch (error) {
    console.error(`Error in getRecipesByCategory:`, error.message);
    res.status(500).json({ message: 'Failed to get recipes for this category' });
  }
};

// 📄 /api/recipes/:id
exports.getRecipeById = async (req, res) => {
  const { id } = req.params;

  try {
    const cached = await Recipe.findOne({ apiId: id });
    if (cached) {
      return res.json({ fromCache: true, recipe: cached });
    }

    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const meal = response.data.meals?.[0];

    if (!meal) {
      return res.status(404).json({ message: `No recipe found with ID '${id}'` });
    }

    const newRecipe = new Recipe({
      apiId: meal.idMeal,
      title: meal.strMeal,
      image: meal.strMealThumb,
      instructions: meal.strInstructions,
      ingredients: getIngredients(meal),
    });

    await newRecipe.save();

    res.json({ fromCache: false, recipe: newRecipe });
  } catch (error) {
    console.error(`Error fetching recipe ID ${id}:`, error.message);
    res.status(500).json({ message: 'Failed to get recipe by ID' });
  }
};

// 🔧 Helper
function getIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure ? measure.trim() : ''} ${ingredient.trim()}`);
    }
  }
  return ingredients;
}
