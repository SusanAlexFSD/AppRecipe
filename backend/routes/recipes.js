const express = require("express");
const router = express.Router();
const axios = require("axios");
const Recipe = require("../models/Recipe");
const CategoryCache = require("../models/CategoryCache");

// -------------------- Helper Functions --------------------
function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getIngredients(meal) {
  const ingredients = [];
  if (!meal) return ingredients;

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];

    if (
      ingredient &&
      ingredient.trim() &&
      ingredient.trim().toLowerCase() !== "null"
    ) {
      const measureText =
        measure &&
        measure.trim() &&
        measure.trim().toLowerCase() !== "null"
          ? measure.trim()
          : "";

      ingredients.push(
        measureText
          ? `${measureText} ${ingredient.trim()}`.trim()
          : ingredient.trim()
      );
    }
  }

  return ingredients;
}

// ==================== IMPORTANT: SPECIFIC ROUTES MUST COME FIRST ====================

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Recipes route working" });
});

// -------------------- Search Recipes --------------------
router.get("/search", async (req, res) => {
  console.log("🔍 Search route hit with query:", req.query.q);

  const query = req.query.q || "";

  if (!query.trim()) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const response = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
        query
      )}`,
      { timeout: 15000 }
    );

    const meals = response.data.meals || [];

    if (!meals.length) {
      return res.status(404).json({
        message: "No recipes found",
        recipes: [],
      });
    }

    const recipes = meals
      .filter((meal) => {
        const hasId = meal?.idMeal;
        if (!hasId) console.warn("Meal missing idMeal:", meal?.strMeal);
        return hasId;
      })
      .map((meal) => ({
        apiId: meal.idMeal,
        title: meal.strMeal || "Untitled Recipe",
        image: meal.strMealThumb || "",
        instructions: meal.strInstructions || "",
        ingredients: getIngredients(meal),
        category: normalizeText(meal.strCategory),
        area: normalizeText(meal.strArea),
      }));

    if (recipes.length === 0) {
      return res.status(404).json({
        message: "No valid recipes found",
        recipes: [],
      });
    }

    try {
      const bulkOps = recipes.map((recipe) => ({
        updateOne: {
          filter: { apiId: recipe.apiId },
          update: { $set: recipe },
          upsert: true,
        },
      }));

      await Recipe.bulkWrite(bulkOps, { ordered: false });
      console.log("✅ Recipes saved to database");
    } catch (dbError) {
      console.warn(
        "⚠️ Database save failed (continuing anyway):",
        dbError.message
      );
    }

    res.json(recipes);
  } catch (error) {
    console.error("❌ Search error:", error?.response?.data || error.message);

    if (error.response) {
      res.status(502).json({
        message: "External API failed",
        error: error.response.status,
        recipes: [],
      });
    } else if (error.request) {
      res.status(504).json({
        message: "No response from external API",
        recipes: [],
      });
    } else {
      res.status(500).json({
        message: "Internal server error",
        error: error.message,
        recipes: [],
      });
    }
  }
});

// -------------------- Category Routes --------------------
router.get("/category/:category", async (req, res) => {
  console.log("📂 Category route hit:", req.params.category);

  const category = normalizeText(req.params.category);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  try {
    const cached = await CategoryCache.findOne({ category });

    if (cached && cached.createdAt > oneHourAgo && cached.data?.length > 0) {
      console.log("✅ Serving from cache");
      return res.json({ recipes: cached.data, fromCache: true });
    }

    console.log("🌐 Fetching from API...");

    const { data } = await axios.get(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(
        category
      )}`,
      { timeout: 15000 }
    );

    const meals = data.meals || [];

    const recipes = meals
      .filter((meal) => meal.idMeal)
      .map((meal) => ({
        apiId: meal.idMeal,
        title: meal.strMeal || "Untitled Recipe",
        image: meal.strMealThumb || "",
        category,
        area: "",
      }));

    await CategoryCache.findOneAndUpdate(
      { category },
      { $set: { data: recipes, createdAt: new Date() } },
      { upsert: true, new: true }
    );

    res.json({ recipes, fromCache: false });
  } catch (error) {
    console.error("❌ Error fetching category recipes:", error);
    res.status(500).json({
      message: "Failed to fetch recipes by category",
      error: error.message,
    });
  }
});

// Clear all caches and recipes
router.delete("/clear-all-cache", async (req, res) => {
  try {
    await CategoryCache.deleteMany({});
    await Recipe.deleteMany({});
    res.json({ message: "All caches and recipes cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear category cache only
router.delete("/cache", async (req, res) => {
  try {
    await CategoryCache.deleteMany({});
    res.json({ message: "All caches cleared" });
  } catch (error) {
    console.error("Error clearing caches:", error);
    res.status(500).json({
      message: "Failed to clear caches",
      error: error.message,
    });
  }
});

// ==================== GENERAL ROUTES ====================

// -------------------- Fetch All Recipes --------------------
router.get("/", async (req, res) => {
  console.log("📋 Root recipes route hit");

  const limit = Number(req.query.limit) || 1000;

  try {
    const recipes = await Recipe.find({
      apiId: { $exists: true },
      title: { $exists: true, $ne: "" },
      image: { $exists: true, $ne: "" },
    })
      .select("apiId title image instructions ingredients category area")
      .limit(limit)
      .lean();

    const normalizedRecipes = recipes.map((recipe) => ({
      ...recipe,
      category: normalizeText(recipe.category),
      area: normalizeText(recipe.area),
    }));

    console.log(`✅ Serving ${normalizedRecipes.length} recipes from database`);
    return res.json(normalizedRecipes);
  } catch (error) {
    console.error("❌ Error fetching recipes:", error);
    res.status(500).json({
      message: "Failed to fetch recipes",
      error: error.message,
    });
  }
});

// -------------------- Seed All Meals --------------------
async function seedAllMealsFromFirstLetters() {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const CONCURRENCY = 4;
  const axiosOpts = { timeout: 15000 };

  const batches = [];
  for (let i = 0; i < letters.length; i += CONCURRENCY) {
    batches.push(letters.slice(i, i + CONCURRENCY));
  }

  for (const batch of batches) {
    const requests = batch.map((letter) =>
      axios
        .get(
          `https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`,
          axiosOpts
        )
        .then((response) => response.data?.meals || [])
        .catch((error) => {
          console.warn(`⚠️ Seed fetch failed for '${letter}':`, error.message);
          return [];
        })
    );

    const results = await Promise.all(requests);
    const meals = results.flat();

    if (!meals.length) continue;

    const docs = meals
      .filter((meal) => meal?.idMeal)
      .map((meal) => ({
        updateOne: {
          filter: { apiId: meal.idMeal },
          update: {
            $set: {
              apiId: meal.idMeal,
              title: meal.strMeal || "Untitled Recipe",
              image: meal.strMealThumb || "",
              instructions: meal.strInstructions || "",
              ingredients: getIngredients(meal),
              category: normalizeText(meal.strCategory),
              area: normalizeText(meal.strArea),
            },
          },
          upsert: true,
        },
      }));

    if (docs.length) {
      try {
        await Recipe.bulkWrite(docs, { ordered: false });
        console.log(
          `➕ Seeded/updated ${docs.length} meals for batch [${batch.join(", ")}]`
        );
      } catch (error) {
        console.warn("⚠️ bulkWrite warnings:", error.message);
      }
    }
  }
}

// -------------------- Fetch Recipe by ID --------------------
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Recipe by ID route hit: ${id}`);

  if (id === "search" || id.includes("=")) {
    return res.status(400).json({ message: "Invalid recipe ID format" });
  }

  try {
    let cachedRecipe = await Recipe.findOne({ apiId: id }).lean();

    if (!cachedRecipe && id.match(/^[0-9a-fA-F]{24}$/)) {
      cachedRecipe = await Recipe.findById(id).lean();
    }

    if (cachedRecipe) {
      return res.json({
        fromCache: true,
        recipe: {
          ...cachedRecipe,
          category: normalizeText(cachedRecipe.category),
          area: normalizeText(cachedRecipe.area),
        },
      });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const { data } = await axios.get(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`,
        { timeout: 15000 }
      );

      const meal = data?.meals?.[0];

      if (!meal?.idMeal) {
        return res.status(404).json({ message: "Recipe not found" });
      }

      const newRecipe = new Recipe({
        apiId: meal.idMeal,
        title: meal.strMeal || "Untitled Recipe",
        image: meal.strMealThumb || "",
        instructions: meal.strInstructions || "",
        ingredients: getIngredients(meal),
        category: normalizeText(meal.strCategory),
        area: normalizeText(meal.strArea),
      });

      await newRecipe.save();

      return res.json({
        fromCache: false,
        recipe: {
          ...newRecipe.toObject(),
          category: normalizeText(newRecipe.category),
          area: normalizeText(newRecipe.area),
        },
      });
    }

    return res.status(404).json({ message: "Recipe not found" });
  } catch (error) {
    console.error("❌ Error fetching recipe by ID:", error);
    res.status(500).json({
      message: "Failed to fetch recipe",
      error: error.message,
    });
  }
});

module.exports = router;