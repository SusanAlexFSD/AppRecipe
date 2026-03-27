import React, { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import "./RecipeCard.css";

export default function RecipeCard({
  id,
  title,
  image,
  recipe,
  favorites,
  setFavorites,
}) {
  const { user } = useContext(AuthContext);

  const [shoppingAdded, setShoppingAdded] = useState(false);
  const [favoriteJustAdded, setFavoriteJustAdded] = useState(false);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const favoriteTimerRef = useRef(null);
  const shoppingTimerRef = useRef(null);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (favoriteTimerRef.current) clearTimeout(favoriteTimerRef.current);
      if (shoppingTimerRef.current) clearTimeout(shoppingTimerRef.current);
    };
  }, []);

  const getRecipeId = (item) => item?.apiId || item?.id || item?._id;

  const isFavorited = favorites.some(
    (fav) => String(getRecipeId(fav)) === String(id)
  );

  const showTemporaryFavoriteSuccess = () => {
    if (favoriteTimerRef.current) clearTimeout(favoriteTimerRef.current);
    setFavoriteJustAdded(true);
    favoriteTimerRef.current = setTimeout(() => {
      setFavoriteJustAdded(false);
    }, 1000);
  };

  const showTemporaryShoppingSuccess = () => {
    if (shoppingTimerRef.current) clearTimeout(shoppingTimerRef.current);
    setShoppingAdded(true);
    shoppingTimerRef.current = setTimeout(() => {
      setShoppingAdded(false);
    }, 1000);
  };

  // -----------------------------
  // FAVORITES
  // -----------------------------
  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (favoriteLoading) return;

    const userId = user?._id || null;
    const recipeId = id;

    try {
      setFavoriteLoading(true);

      if (isFavorited) {
        // REMOVE FAVORITE
        if (userId) {
          await axios.delete("/favorites/remove", {
            data: { userId, recipeId },
          });

          setFavorites((prev) =>
            prev.filter((fav) => String(getRecipeId(fav)) !== String(recipeId))
          );
        } else {
          const updated = favorites.filter(
            (fav) => String(getRecipeId(fav)) !== String(recipeId)
          );
          setFavorites(updated);
          localStorage.setItem("favorites", JSON.stringify(updated));
        }

        setFavoriteJustAdded(false);
      } else {
        // ADD FAVORITE
        const recipePreview = {
          apiId: id,
          id,
          title,
          image,
        };

        if (userId) {
          await axios.post("/favorites/add", {
            userId,
            recipeId,
            recipeTitle: title,
            recipeImage: image,
          });

          setFavorites((prev) => [...prev, recipePreview]);
        } else {
          const updated = [...favorites, recipePreview];
          setFavorites(updated);
          localStorage.setItem("favorites", JSON.stringify(updated));
        }

        showTemporaryFavoriteSuccess();
      }
    } catch (err) {
      console.error("Failed to update favorites:", err);
      alert("Failed to update favorites.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // -----------------------------
  // SHOPPING LIST
  // -----------------------------
  const handleShoppingClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (shoppingLoading) return;

    try {
      setShoppingLoading(true);

      let fullRecipe = recipe;

      // Fetch full recipe if needed
      if (!fullRecipe?.ingredients?.length) {
        const res = await axios.get(`/recipes/${id}`);
        fullRecipe = res.data.recipe || res.data;
      }

      if (!fullRecipe?.ingredients?.length || !fullRecipe?.title) {
        alert("Recipe ingredients are not available.");
        return;
      }

      // ⭐ IMPORTANT: Ensure image is included
      const recipeImage = fullRecipe.image || image || null;

      console.log("FULL RECIPE SENT TO SHOPPING LIST:", fullRecipe);


      if (user?._id) {
        await axios.post("/shoppingList", {
          userId: user._id,
          recipeName: fullRecipe.title,
          ingredients: fullRecipe.ingredients,
          image: recipeImage, // ⭐ FIXED
        });
      } else {
        // LocalStorage fallback
        const savedList =
          JSON.parse(localStorage.getItem("shoppingList")) || [];

        const updatedShoppingList = [
          ...savedList,
          {
            recipeId: getRecipeId(fullRecipe) || id,
            recipeName: fullRecipe.title,
            ingredients: fullRecipe.ingredients,
            image: recipeImage, // ⭐ FIXED
          },
        ];

        localStorage.setItem(
          "shoppingList",
          JSON.stringify(updatedShoppingList)
        );
      }

      showTemporaryShoppingSuccess();
    } catch (err) {
      console.error("Failed to add to shopping list:", err);
      alert("Failed to add to shopping list.");
    } finally {
      setShoppingLoading(false);
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="card">
      <div className="card-imgWrap">
        <img src={image} alt={title} className="card-img" />

        <div className="card-iconActions">
          <button
            type="button"
            className={`card-iconBtn card-iconBtn-favorite ${
              isFavorited ? "is-active" : ""
            } ${favoriteJustAdded ? "is-success" : ""}`}
            onClick={handleFavoriteClick}
            aria-label={
              isFavorited ? "Remove from favorites" : "Add to favorites"
            }
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            disabled={favoriteLoading}
          >
            <span className="card-icon">
              {favoriteJustAdded ? "✓" : "♥"}
            </span>
          </button>

          <button
            type="button"
            className={`card-iconBtn card-iconBtn-cart ${
              shoppingAdded ? "is-success" : ""
            }`}
            onClick={handleShoppingClick}
            aria-label="Add to shopping list"
            title="Add to shopping list"
            disabled={shoppingLoading}
          >
            <span className="card-icon">
              {shoppingAdded ? "✓" : "🛒"}
            </span>
          </button>
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-title">{title}</h3>

        <div className="card-meta">
          <span className="stars">
            {"★".repeat(Math.floor(Math.random() * 2) + 4)}
          </span>
          <span className="rating">{(Math.random() * 1 + 4).toFixed(1)}</span>
          <span className="reviews">
            ({Math.floor(Math.random() * 250) + 25} reviews)
          </span>
          <span className="card-time">
            • {Math.floor(Math.random() * 40) + 10} min
          </span>
        </div>

        <Link to={`/recipe/${id}`}>
          <button className="card-btn">View Recipe →</button>
        </Link>
      </div>
    </div>
  );
}
