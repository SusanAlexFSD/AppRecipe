const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  // For single recipes
  apiId: { type: String, unique: true, sparse: true }, // external API ID, optional
  title: String,
  image: String,
  instructions: String,
  ingredients: [String],

  // For category cache documents
  category: { type: String, lowercase: true, index: true, sparse: true }, // category name for cached category recipes
  data: [
    {
      apiId: String,
      title: String,
      image: String,
      // other fields as needed
    }
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Recipe', recipeSchema);
