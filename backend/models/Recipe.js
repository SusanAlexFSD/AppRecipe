// models/Recipe.js
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  apiId: { type: String },
  title: String,
  image: String,
  instructions: String,
  ingredients: [String],
  category: String, // optional, if you want to store it
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);