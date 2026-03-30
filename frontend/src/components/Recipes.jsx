import React, { useState, useEffect, useMemo, useContext } from "react";
import axios from "../api/axios";
import RecipeCard from "./RecipeCard";
import RecipesSidebar from "./RecipesSidebar";
import { AuthContext } from "../context/AuthContext";
import "./Recipes.css";

export default function Recipes() {
  const { user } = useContext(AuthContext);

  const [allRecipes, setAllRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [recipeView, setRecipeView] = useState("featured");
  const [hasLoadedAll, setHasLoadedAll] = useState(false);

  const normalizeValue = (value) => String(value || "").trim().toLowerCase();

  const fetchRecipes = async (limit = 20) => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get("/recipes", { params: { limit } });
      const data = Array.isArray(res.data) ? res.data : res.data.recipes || [];

      const cleaned = data.map((recipe, index) => ({
        ...recipe,
        category: normalizeValue(recipe.category),
        originalIndex: index,
      }));

      setAllRecipes(cleaned);
      if (limit > 20) {
        setHasLoadedAll(true);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes(20);
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      if (user?._id) {
        try {
          const res = await axios.get(`/favorites/${user._id}`);
          setFavorites(res.data.favorites || []);
        } catch (err) {
          console.error("Failed to load favorites:", err);
        }
      } else {
        const saved = JSON.parse(localStorage.getItem("favorites")) || [];
        setFavorites(saved);
      }
    };

    loadFavorites();
  }, [user]);

  useEffect(() => {
    const loadShoppingList = async () => {
      if (user?._id) {
        try {
          const res = await axios.get(`/shoppingList/${user._id}`);
          setShoppingList(res.data.items || []);
        } catch (err) {
          console.error("Failed to load shopping list:", err);
        }
      } else {
        const saved = JSON.parse(localStorage.getItem("shoppingList")) || [];
        setShoppingList(saved);
      }
    };

    loadShoppingList();
  }, [user]);

  const toggleCategory = (value) => {
    const normalized = normalizeValue(value);

    setSelectedCategories((prev) =>
      prev.includes(normalized)
        ? prev.filter((c) => c !== normalized)
        : [...prev, normalized]
    );

    if (recipeView === "featured") {
      setRecipeView("all");
      if (!hasLoadedAll) {
        fetchRecipes(200);
      }
    }
  };

  const clearFilters = () => {
    setSelectedCategories([]);
  };

  const handleSwitchView = async (view) => {
    setRecipeView(view);

    if (view === "all" && !hasLoadedAll) {
      await fetchRecipes(200);
    }

    if (view === "featured" && hasLoadedAll) {
      await fetchRecipes(20);
      setHasLoadedAll(false);
    }
  };

  const handleBrowseAll = async () => {
    setRecipeView("all");

    if (!hasLoadedAll) {
      await fetchRecipes(200);
    }
  };

  const categories = useMemo(() => {
    const unique = [
      ...new Set(allRecipes.map((r) => normalizeValue(r.category)).filter(Boolean)),
    ];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [allRecipes]);

  const filteredRecipes = useMemo(() => {
    if (selectedCategories.length === 0) return allRecipes;

    return allRecipes.filter((recipe) =>
      selectedCategories.includes(recipe.category)
    );
  }, [allRecipes, selectedCategories]);

  const sortedRecipes = useMemo(() => {
    const list = [...filteredRecipes];

    switch (sortBy) {
      case "popular":
        return list.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));

      case "rating":
        return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

      case "quickest":
        return list.sort(
          (a, b) => (a.readyInMinutes ?? 9999) - (b.readyInMinutes ?? 9999)
        );

      case "az":
        return list.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );

      case "za":
        return list.sort((a, b) =>
          (b.title || "").localeCompare(a.title || "")
        );

      case "category":
        return list.sort((a, b) =>
          normalizeValue(a.category).localeCompare(normalizeValue(b.category))
        );

      default:
        return list.sort((a, b) => b.originalIndex - a.originalIndex);
    }
  }, [filteredRecipes, sortBy]);

  return (
    <>
      <div className="recipes-hero">
        <div className="recipes-hero-content">
          <h1>Find Delicious Recipes</h1>
          <p>Discover quick, easy, and delicious recipes suited to your taste.</p>
          <button className="browse-btn" onClick={handleBrowseAll}>
            Browse All Recipes →
          </button>
        </div>
      </div>

      <div className="recipes-layout">
        <RecipesSidebar
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onClearFilters={clearFilters}
        />

        <div className="recipes-main">
          <div className="recipes-switcher">
            <button
              className={`recipes-switch-btn ${
                recipeView === "featured" ? "active" : ""
              }`}
              onClick={() => handleSwitchView("featured")}
              type="button"
            >
              Featured Recipes
            </button>

            <span className="recipes-switch-divider">/</span>

            <button
              className={`recipes-switch-btn ${
                recipeView === "all" ? "active" : ""
              }`}
              onClick={() => handleSwitchView("all")}
              type="button"
            >
              All Recipes
            </button>
          </div>

          <div className="recipes-topbar">
            <h2>{recipeView === "featured" ? "Featured Recipes" : "All Recipes"}</h2>

            <div className="recipes-sort">
              <label htmlFor="recipe-sort">Sort:</label>
              <select
                id="recipe-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="rating">Top Rated</option>
                <option value="quickest">Quickest</option>
                <option value="az">A–Z</option>
                <option value="za">Z–A</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>

          {loading && <p>Loading recipes...</p>}
          {error && <p>{error}</p>}

          {!loading && !error && sortedRecipes.length === 0 && (
            <p className="no-recipes-message">No recipes found.</p>
          )}

          <div className="recipe-grid">
            {sortedRecipes.map((recipe) => {
              const recipeId = recipe.apiId || recipe._id;
              const title = recipe.title;
              const image = recipe.image;

              return (
                <RecipeCard
                  key={recipeId}
                  id={recipeId}
                  title={title}
                  image={image}
                  recipe={recipe}
                  favorites={favorites}
                  setFavorites={setFavorites}
                  shoppingList={shoppingList}
                  setShoppingList={setShoppingList}
                  user={user}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}