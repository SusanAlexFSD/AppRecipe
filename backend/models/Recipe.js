const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  apiId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  image: { type: String, default: '' },
  ingredients: { type: [String], default: [] },
  instructions: { type: String, default: '' },
  category: { type: String, default: '' },
  area: { type: String, default: '' },
});

module.exports = mongoose.model('Recipe', recipeSchema);