const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      recipeName: { type: String, required: true },
      ingredients: [String],
    },
  ],
});

// ✅ Prevent OverwriteModelError
const ShoppingList = mongoose.models.ShoppingList || mongoose.model('ShoppingList', shoppingListSchema);

module.exports = ShoppingList;
