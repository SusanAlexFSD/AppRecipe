const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");

console.log("🔥 FAVORITES ROUTE FILE LOADED");

/* ============================================================
   DEBUG ROUTE
============================================================ */
router.delete("/debug-delete", (req, res) => {
  return res.json({ message: "DELETE route works" });
});

/* ============================================================
   DELETE ALL FAVORITES FOR A USER
============================================================ */
router.delete("/clear/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("🔥 DELETE ALL FAVORITES for user:", userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const result = await Favorite.deleteMany({ userId });

    return res.json({
      message: "All favorites cleared",
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Failed to clear favorites:", error);
    return res.status(500).json({
      message: "Failed to clear favorites",
      error: error.message,
    });
  }
});

/* ============================================================
   REMOVE A SINGLE FAVORITE
============================================================ */
router.delete("/remove", async (req, res) => {
  const { userId = null, recipeId } = req.body;

  if (!recipeId) {
    return res.status(400).json({ message: "recipeId is required" });
  }

  try {
    const deleted = await Favorite.findOneAndDelete({ userId, recipeId });

    return res.json({
      message: deleted ? "Removed from favorites" : "Favorite not found",
    });
  } catch (error) {
    console.error("❌ Failed to remove favorite:", error);
    return res.status(500).json({
      message: "Failed to remove favorite",
      error: error.message,
    });
  }
});

/* ============================================================
   ADD TO FAVORITES
============================================================ */
router.post("/add", async (req, res) => {
  const { userId = null, recipeId, recipeTitle = "", recipeImage = "" } = req.body;

  if (!recipeId) {
    return res.status(400).json({ message: "recipeId is required" });
  }

  try {
    const exists = await Favorite.findOne({ userId, recipeId });

    if (exists) {
      return res.status(409).json({ message: "Already in favorites" });
    }

    const newFavorite = new Favorite({
      userId,
      recipeId,
      recipeTitle,
      recipeImage,
    });

    await newFavorite.save();

    return res.status(201).json({
      message: "Added to favorites",
      favorite: newFavorite,
    });
  } catch (error) {
    console.error("❌ Failed to add favorite:", error);
    return res.status(500).json({
      message: "Failed to add favorite",
      error: error.message,
    });
  }
});

/* ============================================================
   INTERNAL HELPER: GET FAVORITES FOR USER
============================================================ */
async function getFavoritesForUser(req, res) {
  const { userId } = req.params;
  console.log("📥 GET FAVORITES for user:", userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1, _id: -1 });

    return res.json({
      favorites: favorites || [],
      count: favorites.length,
    });
  } catch (error) {
    console.error("❌ Failed to fetch favorites:", error);
    return res.status(500).json({
      message: "Failed to fetch favorites",
      error: error.message,
    });
  }
}

/* ============================================================
   GET FAVORITES FOR A USER
   BOTH ROUTES SUPPORTED
============================================================ */
router.get("/user/:userId", getFavoritesForUser);
router.get("/:userId", getFavoritesForUser);

module.exports = router;