const mongoose = require('mongoose');

const embeddedRecipeSchema = new mongoose.Schema({
  apiId: String,
  title: String,
  image: String,
  instructions: String,
  ingredients: [String],
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  // For individual recipe documents
  apiId: { type: String, unique: true, sparse: true },
  title: String,
  image: String,
  instructions: String,
  ingredients: [String],

  // For category-cached documents
  category: { type: String, lowercase: true, index: true, sparse: true },
  data: [embeddedRecipeSchema], // now supports full recipe structure

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Recipe', recipeSchema);
