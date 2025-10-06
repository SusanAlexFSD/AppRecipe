// frontend/src/api/recipes.js
export const API_BASE = "/.netlify/functions"; // Netlify serverless functions path

// Fetch all recipes
export const getRecipes = async () => {
  const response = await fetch(`${API_BASE}/getRecipes`);
  if (!response.ok) throw new Error(`Failed to fetch recipes: ${response.status}`);
  return response.json();
};

// Add a new recipe
export const addRecipe = async (recipe) => {
  const response = await fetch(`${API_BASE}/addRecipe`, {
    method: "POST",
    body: JSON.stringify(recipe),
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) throw new Error(`Failed to add recipe: ${response.status}`);
  return response.json();
};
