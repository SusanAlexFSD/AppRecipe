const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [String],
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);
