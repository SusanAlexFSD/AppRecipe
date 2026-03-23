// src/components/Recipe.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Recipe.css";

export default function Recipe() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  const getRecipeId = (r) => r.apiId || r.id || r._id;

  // Format instructions into readable steps
  const formatInstructions = (text) => {
    if (!text) return [];
    const normalized = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ")
      .trim();

    let parts = normalized.split(/\n+/).map((s) => s.trim()).filter(Boolean);

    if (parts.length <= 2) {
      parts = normalized
        .split(/(?<=\.)\s+(?=[A-Z])|(?<=\.)\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return parts.map((step) =>
      step.replace(/^\s*[-•\d)+.]+\s*/, "").trim()
    );
  };

  // -----------------------------
  // FAVORITES — Add
  // -----------------------------
  const handleAddToFavorites = async () => {
    if (!recipe) return;
    const recipeId = getRecipeId(recipe);

    // Instant UI update
    setFavorites((prev) => [...prev, { apiId: recipeId }]);

    try {
      if (user?._id) {
        await axios.post("/favorites/add", {
          userId: user._id,
          recipeId,
          recipeTitle: recipe.title,
          recipeImage: recipe.image,
        });

        const res = await axios.get(`/favorites/${user._id}`);
        setFavorites(res.data.favorites || []);
      } else {
        const updated = [...favorites, recipe];
        setFavorites(updated);
        localStorage.setItem("favorites", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Failed to add to favorites:", err);
    }
  };

  // -----------------------------
  // FAVORITES — Remove
  // -----------------------------
  const handleRemoveFromFavorites = async () => {
    if (!recipe) return;
    const recipeId = getRecipeId(recipe);

    // Instant UI update
    setFavorites((prev) =>
      prev.filter((fav) => getRecipeId(fav) !== recipeId)
    );

    try {
      if (user?._id) {
        await axios.delete("/favorites/remove", {
          data: { userId: user._id, recipeId },
        });

        const res = await axios.get(`/favorites/${user._id}`);
        setFavorites(res.data.favorites || []);
      } else {
        const updated = favorites.filter(
          (fav) => getRecipeId(fav) !== recipeId
        );
        setFavorites(updated);
        localStorage.setItem("favorites", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Failed to remove from favorites:", err);
    }
  };

  // -----------------------------
  // SHOPPING LIST — Add
  // -----------------------------
  const handleAddToShoppingList = async () => {
    if (!user?._id) return;

    // Instant UI update
    setShoppingList((prev) => [...prev, recipe]);

    try {
      await axios.post("/shoppingList", {
        userId: user._id,
        recipeName: recipe.title,
        ingredients: recipe.ingredients,
      });
    } catch (err) {
      console.error("Failed to save shopping list:", err);
    }
  };

  // -----------------------------
  // Load local storage for guests
  // -----------------------------
  useEffect(() => {
    if (!user) {
      const savedFavs = JSON.parse(localStorage.getItem("favorites")) || [];
      setFavorites(savedFavs);
    }

    const savedList = JSON.parse(localStorage.getItem("shoppingList")) || [];
    setShoppingList(savedList);
  }, [user]);

  useEffect(() => {
    if (!user) localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites, user]);

  useEffect(() => {
    localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  }, [shoppingList]);

  // -----------------------------
  // Load favorites for logged-in users
  // -----------------------------
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?._id) return;
      try {
        const res = await axios.get(`/favorites/${user._id}`);
        setFavorites(res.data.favorites || []);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    };
    fetchFavorites();
  }, [user]);

  // -----------------------------
  // Fetch recipe
  // -----------------------------
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`/recipes/${id}`);
        setRecipe(res.data.recipe || res.data);
      } catch (err) {
        console.error("API Error:", err);
        setError(
          err.response?.status === 404
            ? "Recipe not found"
            : "Failed to load recipe"
        );
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRecipe();
  }, [id]);

  if (loading) return <p>Loading recipe...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!recipe) return <p>No recipe found.</p>;

  const isFavorited = favorites.some(
    (fav) => getRecipeId(fav) === getRecipeId(recipe)
  );

  const isInShoppingList = shoppingList.some(
    (item) => getRecipeId(item) === getRecipeId(recipe)
  );

  const steps = formatInstructions(recipe.instructions);

  return (
    <div className="recipe-page">
      <nav className="recipe-back">
        <Link to="/">← Back to Recipes</Link>
      </nav>

      <h1 className="recipe-title">{recipe.title}</h1>

      {/* BBC-STYLE TOP SECTION */}
      <div className="recipe-top">
        {recipe.image && (
          <img className="recipe-top-image" src={recipe.image} alt={recipe.title} />
        )}

        <div className="recipe-meta">
          <div className="recipe-rating">
            ★★★★☆ <span>4.5</span> | <span>2 ratings</span>
            <button className="rate-btn">Rate this recipe</button>
          </div>

          <div className="recipe-times">
            <p><strong>Prepare:</strong> Less than 30 mins</p>
            <p><strong>Cook:</strong> Less than 10 mins</p>
            <p><strong>Serves:</strong> 2</p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="recipe-actions">
            {isFavorited ? (
              <button className="favorite-btn remove" onClick={handleRemoveFromFavorites}>
                ✔ In Favorites
              </button>
            ) : (
              <button className="favorite-btn" onClick={handleAddToFavorites}>
                + Add to Favorites
              </button>
            )}

            {isInShoppingList ? (
              <button className="shopping-btn added">
                ✔ Added to Shopping List
              </button>
            ) : (
              <button className="shopping-btn" onClick={handleAddToShoppingList}>
                + Add to Shopping List
              </button>
            )}
          </div>

          <div className="recipe-links">
            <Link to="/favorites" className="link-btn">View Favorites</Link>
            <Link to="/shoppingList" className="link-btn">View Shopping List</Link>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS BELOW */}
      <div className="recipe-columns">
        <section className="ingredients-section">
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients?.length ? (
              recipe.ingredients.map((item, index) => <li key={index}>{item}</li>)
            ) : (
              <li>No ingredients available</li>
            )}
          </ul>
        </section>

        <section className="instructions-section">
          <h2>Method</h2>
          {steps.length ? (
            <ol className="instructions-list">
              {steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          ) : (
            <p>No instructions available.</p>
          )}
        </section>
      </div>
    </div>
  );
}
