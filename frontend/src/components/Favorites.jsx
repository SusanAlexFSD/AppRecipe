import React, { useEffect, useState, useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./Favorites.css";

console.log('🔥 FAVORITES ROUTE FILE LOADED - VERSION WITH CLEAR DELETE');

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const { user } = useContext(AuthContext);

  // -----------------------------
  // Load favorites
  // -----------------------------
  useEffect(() => {
    const fetchFavorites = async () => {
      if (user?._id) {
        try {
          console.log("Axios baseURL:", axios.defaults.baseURL);
          console.log("Fetching favorites for user:", user._id);
          console.log(
            "Full fetch URL:",
            `${axios.defaults.baseURL}/favorites/${user._id}`
          );

          const res = await axios.get(`/favorites/${user._id}`);
          setFavorites(res.data.favorites || []);
        } catch (error) {
          console.error("Failed to fetch favorites from DB:", error);
          console.error("Fetch response:", error?.response);
        }
      } else {
        const saved = JSON.parse(localStorage.getItem("favorites")) || [];
        setFavorites(saved);
      }
    };

    fetchFavorites();
  }, [user]);

  // -----------------------------
  // Remove a single favorite
  // -----------------------------
  const handleRemove = async (recipeId) => {
    const userId = user?._id || null;

    try {
      if (userId) {
        console.log("Axios baseURL:", axios.defaults.baseURL);
        console.log("Removing favorite for user:", userId);
        console.log("Recipe ID:", recipeId);
        console.log(
          "Full remove URL:",
          `${axios.defaults.baseURL}/favorites/remove`
        );

        await axios.delete("/favorites/remove", {
          data: { userId, recipeId },
        });
      }

      setFavorites((prev) => {
        const updated = prev.filter(
          (fav) =>
            (fav.recipeId || fav._id || fav.apiId || fav.id) !== recipeId
        );

        if (!userId) {
          localStorage.setItem("favorites", JSON.stringify(updated));
        }

        return updated;
      });
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      console.error("Remove response:", error?.response);
    }
  };

  // -----------------------------
  // Delete ALL favorites
  // -----------------------------
  const handleDeleteAll = async () => {
  const userId = user?._id;

  try {
    if (userId) {
      console.log("Deleting all favorites for user:", userId);

      const res = await axios.delete(`/favorites/clear/${userId}`);
      console.log("Delete-all response:", res.data);
    } else {
      localStorage.removeItem("favorites");
    }

    setFavorites([]);
  } catch (error) {
    console.error("Failed to clear favorites:", error);
    console.error("Delete-all response:", error?.response);
  }
};

  // -----------------------------
  // Sorting
  // -----------------------------
  const sortedFavorites = useMemo(() => {
    const items = [...favorites];

    switch (sortBy) {
      case "az":
        return items.sort((a, b) =>
          (a.recipeTitle || a.title || a.strMeal || "")
            .toLowerCase()
            .localeCompare(
              (b.recipeTitle || b.title || b.strMeal || "").toLowerCase()
            )
        );

      case "za":
        return items.sort((a, b) =>
          (b.recipeTitle || b.title || b.strMeal || "")
            .toLowerCase()
            .localeCompare(
              (a.recipeTitle || a.title || a.strMeal || "").toLowerCase()
            )
        );

      case "newest":
      default:
        return items.reverse();
    }
  }, [favorites, sortBy]);

  return (
    <div className="favorites-page">
      <Link to="/" className="favorites-back">
        <span>←</span>
        <span>Back to Recipes</span>
      </Link>

      <section className="favorites-hero">
        <div className="favorites-title-wrap">
          <div className="favorites-title-row">
            <span className="favorites-heart">❤️</span>
            <h1 className="favorites-title">Your Favorites</h1>
          </div>

          <p className="favorites-subtitle">
            {favorites.length} saved recipe{favorites.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="favorites-controls">
          <div className="favorites-control">
            <span className="favorites-control-label">Sort by:</span>
            <select
              className="favorites-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="az">A–Z</option>
              <option value="za">Z–A</option>
            </select>
          </div>

          {favorites.length > 0 && (
           <button
              type="button"
              className="favorites-delete-all"
              onClick={handleDeleteAll}
            >
              🗑 Delete All
            </button>
          )}
        </div>
      </section>

      {favorites.length === 0 ? (
        <div className="favorites-empty">
          <p>You haven't added any favorites yet.</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {sortedFavorites.map((recipe) => {
            const id =
              recipe.recipeId ||
              recipe.apiId ||
              recipe.idMeal ||
              recipe._id ||
              recipe.id;

            const title =
              recipe.recipeTitle ||
              recipe.title ||
              recipe.strMeal ||
              "Untitled";

            const image =
              recipe.recipeImage ||
              recipe.image ||
              recipe.strMealThumb ||
              "";

            const category =
              recipe.category ||
              recipe.strCategory ||
              recipe.recipeCategory ||
              "Recipe";

            const time =
              recipe.readyInMinutes ||
              recipe.cookTime ||
              recipe.prepTime ||
              recipe.cookTimeMinutes ||
              "45 min";

            const rating =
              recipe.rating ||
              recipe.averageRating ||
              recipe.avgRating ||
              "4.8";

            return (
              <article key={id} className="favorite-card">
                <div className="favorite-image-wrap">
                  {image && (
                    <img
                      src={image}
                      alt={title}
                      className="favorite-image"
                    />
                  )}

                  <div className="favorite-top-actions">
                    <button
                      type="button"
                      className="favorite-icon-btn favorite-remove-btn"
                      onClick={() => handleRemove(id)}
                      aria-label="Remove from favorites"
                      title="Remove from favorites"
                    >
                      ❌
                    </button>

                    <Link
                      to={`/recipe/${id}`}
                      className="favorite-view-link"
                      aria-label={`View ${title}`}
                      title="View recipe"
                    >
                      <button type="button" className="favorite-icon-btn">
                        👁
                      </button>
                    </Link>
                  </div>
                </div>

                <div className="favorite-content">
                  <h2 className="favorite-title">{title}</h2>
                  <p className="favorite-meta">{category}</p>

                  <div className="favorite-rating-row">
                    <span className="favorite-stars">★★★★☆</span>
                    <span>{rating}</span>
                  </div>

                  <div className="favorite-actions-row">
                    <span className="favorite-time">🕒 {time}</span>

                    <Link to={`/recipe/${id}`}>
                      <button type="button" className="favorite-view-btn">
                        View Recipe
                      </button>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}