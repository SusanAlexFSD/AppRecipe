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

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");

  const getRecipeId = (r) => r?.apiId || r?.id || r?._id;

  const formatInstructions = (text) => {
    if (!text) return [];

    const normalized = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ")
      .trim();

    let parts = normalized
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

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

  const formatIngredient = (ingredient) => {
    if (!ingredient || typeof ingredient !== "string") {
      return { prefix: "", bold: "", suffix: "" };
    }

    const text = ingredient.trim();

    const quantityPattern =
      /^((?:\d+\s\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*(?:[a-zA-Z]+(?:\s?[a-zA-Z]+)*)?\s*)/;

    const quantityMatch = text.match(quantityPattern);

    let prefix = "";
    let remainder = text;

    if (quantityMatch) {
      prefix = quantityMatch[0].trim();
      remainder = text.slice(quantityMatch[0].length).trim();
    }

    if (!remainder) {
      return { prefix: "", bold: text, suffix: "" };
    }

    const commaIndex = remainder.indexOf(",");
    const boldPart =
      commaIndex === -1 ? remainder : remainder.slice(0, commaIndex).trim();
    const suffix =
      commaIndex === -1 ? "" : remainder.slice(commaIndex).trim();

    return {
      prefix,
      bold: boldPart,
      suffix,
    };
  };

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`/api/recipes/${id}`);
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

  const handleAddToFavorites = async () => {
    if (!recipe) return;
    const recipeId = getRecipeId(recipe);

    setFavorites((prev) => [...prev, { apiId: recipeId }]);

    try {
      if (user?._id) {
        await axios.post("/api/favorites/add", {
          userId: user._id,
          recipeId,
          recipeTitle: recipe.title,
          recipeImage: recipe.image,
        });

        const res = await axios.get(`/api/favorites/user/${user._id}`);
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

  const handleRemoveFromFavorites = async () => {
    if (!recipe) return;
    const recipeId = getRecipeId(recipe);

    setFavorites((prev) =>
      prev.filter((fav) => getRecipeId(fav) !== recipeId)
    );

    try {
      if (user?._id) {
        await axios.delete("/api/favorites/remove", {
          data: { userId: user._id, recipeId },
        });

        const res = await axios.get(`/api/favorites/user/${user._id}`);
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

  const handleAddToShoppingList = async () => {
    if (!recipe) return;

    if (!user?._id) {
      const updated = [...shoppingList, recipe];
      setShoppingList(updated);
      localStorage.setItem("shoppingList", JSON.stringify(updated));
      return;
    }

    setShoppingList((prev) => [...prev, recipe]);

    try {
      await axios.post("/api/shoppingList", {
        userId: user._id,
        recipeName: recipe.title,
        ingredients: recipe.ingredients,
      });
    } catch (err) {
      console.error("Failed to save shopping list:", err);
    }
  };

  const openRatingModal = () => {
    setSelectedRating(0);
    setRatingMessage("");
    setIsRatingModalOpen(true);
  };

  const closeRatingModal = () => {
    if (submittingRating) return;
    setIsRatingModalOpen(false);
    setSelectedRating(0);
    setRatingMessage("");
  };

  const handleSubmitRating = async () => {
    if (!recipe) return;

    if (!selectedRating) {
      setRatingMessage("Please choose a star rating.");
      return;
    }

    try {
      setSubmittingRating(true);
      setRatingMessage("");

      await axios.post("/api/recipes/ratings/add", {
        recipeId: getRecipeId(recipe),
        userId: user?._id || null,
        rating: selectedRating,
      });

      setRatingMessage("Rating saved!");
      await fetchRecipe();

      setTimeout(() => {
        setIsRatingModalOpen(false);
        setSelectedRating(0);
        setRatingMessage("");
      }, 1200);
    } catch (err) {
      console.error("Failed to rate recipe:", err);
      console.error("Server response:", err.response?.data);
      console.error("Status:", err.response?.status);

      setRatingMessage(
        err.response?.data?.message || "Failed to save rating."
      );
    } finally {
      setSubmittingRating(false);
    }
  };

  const handlePrintRecipe = () => {
    window.print();
  };

  const handleShareRecipe = async () => {
    if (!recipe) return;

    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: recipe.title,
          text: `Check out this recipe: ${recipe.title}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Recipe link copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to share recipe:", err);
    }
  };

  useEffect(() => {
    if (!user) {
      const savedFavs = JSON.parse(localStorage.getItem("favorites")) || [];
      setFavorites(savedFavs);
    }

    const savedList = JSON.parse(localStorage.getItem("shoppingList")) || [];
    setShoppingList(savedList);
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, user]);

  useEffect(() => {
    localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?._id) return;

      try {
        const res = await axios.get(`/api/favorites/user/${user._id}`);
        setFavorites(res.data.favorites || []);
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    };

    fetchFavorites();
  }, [user]);

  useEffect(() => {
    if (id) {
      fetchRecipe();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="recipe-page">
        <p>Loading recipe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recipe-page">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="recipe-page">
        <p>No recipe found.</p>
      </div>
    );
  }

  const isFavorited = favorites.some(
    (fav) => getRecipeId(fav) === getRecipeId(recipe)
  );

  const isInShoppingList = shoppingList.some(
    (item) => getRecipeId(item) === getRecipeId(recipe)
  );

  const steps = formatInstructions(recipe.instructions);
  const ratingValue = recipe.rating ?? 0;
  const ratingCount = recipe.ratingCount ?? 0;

  return (
    <div className="recipe-page">
      <nav className="recipe-back">
        <Link to="/">← Back to Recipes</Link>
      </nav>

      <h1 className="recipe-title">{recipe.title}</h1>

      <div className="recipe-rating-block">
        <div className="recipe-rating">
          <span className="recipe-stars">★★★★☆</span>
          <span className="recipe-score">{ratingValue}</span>
          <span className="recipe-rating-separator">|</span>
          <span className="recipe-rating-count">
            {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
          </span>
        </div>

        <button className="rate-btn" type="button" onClick={openRatingModal}>
          Rate this recipe
        </button>
      </div>

      <div className="recipe-top">
        <div className="recipe-image-column">
          {recipe.image && (
            <img
              className="recipe-top-image"
              src={recipe.image}
              alt={recipe.title}
            />
          )}
        </div>

        <div className="recipe-meta">
          <div className="recipe-times">
            <div className="recipe-time-item">
              <h3>Prepare</h3>
              <p>Less than 30 mins</p>
            </div>

            <div className="recipe-time-item">
              <h3>Cook</h3>
              <p>Less than 10 mins</p>
            </div>

            <div className="recipe-time-item">
              <h3>Serves</h3>
              <p>2</p>
            </div>
          </div>

          <div className="recipe-actions">
            {isFavorited ? (
              <button
                className="favorite-btn remove"
                onClick={handleRemoveFromFavorites}
                type="button"
              >
                ✔ In Favorites
              </button>
            ) : (
              <button
                className="favorite-btn"
                onClick={handleAddToFavorites}
                type="button"
              >
                + Add to Favorites
              </button>
            )}

            {isInShoppingList ? (
              <button className="shopping-btn added" type="button">
                ✔ Added to Shopping List
              </button>
            ) : (
              <button
                className="shopping-btn"
                onClick={handleAddToShoppingList}
                type="button"
              >
                + Add to Shopping List
              </button>
            )}
          </div>

          <div className="recipe-links">
            <Link to="/favorites" className="link-btn">
              View Favorites
            </Link>

            <Link to="/shoppingList" className="link-btn">
              View Shopping List
            </Link>

            <button
              type="button"
              className="link-btn"
              onClick={handlePrintRecipe}
            >
              Print Recipe
            </button>

            <button
              type="button"
              className="link-btn"
              onClick={handleShareRecipe}
            >
              Share Recipe
            </button>
          </div>
        </div>
      </div>

      <div className="recipe-columns">
        <section className="ingredients-section">
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients?.length ? (
              recipe.ingredients.map((item, index) => {
                const { prefix, bold, suffix } = formatIngredient(item);

                return (
                  <li key={index}>
                    {prefix && <span>{prefix} </span>}
                    <strong className="ingredient-name">{bold}</strong>
                    {suffix && <span> {suffix}</span>}
                  </li>
                );
              })
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

      {isRatingModalOpen && (
        <div className="rating-modal-overlay" onClick={closeRatingModal}>
          <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="rating-modal-close"
              type="button"
              onClick={closeRatingModal}
              aria-label="Close rating modal"
            >
              ×
            </button>

            <h3 className="rating-modal-title">Rate this recipe</h3>

            <div className="rating-modal-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`rating-modal-star ${
                    selectedRating >= star ? "active" : ""
                  }`}
                  onClick={() => setSelectedRating(star)}
                  aria-label={`Select ${star} star${star > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>

            <button
              type="button"
              className="rating-submit-btn"
              onClick={handleSubmitRating}
              disabled={submittingRating}
            >
              {submittingRating ? "Saving..." : "Submit Rating"}
            </button>

            {ratingMessage && (
              <p className="rating-modal-message">{ratingMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}