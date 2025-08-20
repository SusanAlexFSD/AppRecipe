const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  apiId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  image: { type: String },
  ingredients: { type: [String], default: [] },
  instructions: { type: String },
  category: { type: String },
});

module.exports = mongoose.model('Recipe', recipeSchema);