const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    apiId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    image: { type: String, default: "" },
    ingredients: { type: [String], default: [] },
    instructions: { type: String, default: "" },
    category: { type: String, default: "" },
    area: { type: String, default: "" },

    ratings: {
      type: [ratingSchema],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", recipeSchema);