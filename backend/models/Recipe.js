//Defines how the recipe data will be stored in your MongoDB collection

const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  idMeal: { type: String, unique: true },
  strMeal: String,
  strInstructions: String,
  strMealThumb: String,
  ingredients: [String],
  cachedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recipe', recipeSchema);
