// models/Favorite.js
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: false }, // null or undefined for guests
  recipeId: { type: String, required: true },
  recipeTitle: String,
  recipeImage: String,
  // You can add other fields like ingredients if needed
}, { timestamps: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
