// src/components/Recipe.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import './Recipe.css';

export default function Recipe() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  const getRecipeId = (r) => r.apiId || r.id || r._id;

  // --- Helpers ---
  // Split a long instructions string into readable steps for <ol>
  const formatInstructions = (text) => {
    if (!text) return [];

    // Normalize whitespace
    const normalized = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .trim();

    // 1) Try splitting by line breaks when present
    let parts = normalized.split(/\n+/).map(s => s.trim()).filter(Boolean);

    // 2) If it looks like one giant paragraph, split by sentence-ish boundaries.
    // Use a conservative split on ". " or ".\n" while keeping abbreviations somewhat intact.
    if (parts.length <= 2) {
      parts = normalized
        .split(/(?<=\.)\s+(?=[A-Z])|(?<=\.)\n+/) // split after a period followed by space/newline and a capital
        .map(s => s.trim())
        .filter(Boolean);
    }

    // 3) Clean up bullet/number prefixes that TheMealDB sometimes includes
    parts = parts.map(step => step.replace(/^\s*[-•\d)+.]+\s*/, '').trim()).filter(Boolean);

    return parts;
  };

  // --- Favorites ---
  const handleAddToFavorites = async () => {
    if (!recipe) return;
    const userId = user?._id || null;
    const recipeId = getRecipeId(recipe);

    if (favorites.some(fav => getRecipeId(fav) === recipeId)) {
      alert('Already in favorites');
      return;
    }

    try {
      if (userId) {
        await axios.post('/favorites/add', {
          userId,
          recipeId,
          recipeTitle: recipe.title,
          recipeImage: recipe.image,
        });
        // fetch latest favorites from server (safer than optimistic push)
        const res = await axios.get(`/favorites/${userId}`);
        setFavorites(res.data.favorites || []);
      } else {
        const updatedFavorites = [...favorites, recipe];
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      }
      alert('Added to favorites!');
    } catch (err) {
      console.error('Failed to add to favorites:', err);
      alert('Failed to add to favorites.');
    }
  };

  const handleRemoveFromFavorites = async () => {
    if (!recipe) return;
    const userId = user?._id || null;
    const recipeId = getRecipeId(recipe);

    try {
      if (userId) {
        await axios.delete('/favorites/remove', { data: { userId, recipeId } });
        const res = await axios.get(`/favorites/${userId}`);
        setFavorites(res.data.favorites || []);
      } else {
        const updatedFavorites = favorites.filter(fav => getRecipeId(fav) !== recipeId);
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      }
      alert('Removed from favorites!');
    } catch (err) {
      console.error('Failed to remove from favorites:', err);
      alert('Failed to remove from favorites.');
    }
  };

  // --- Shopping List ---
  const handleAddToShoppingList = async () => {
    if (!user?._id) {
      alert('You must be logged in to add to shopping list.');
      return;
    }

    if (recipe?.ingredients?.length && recipe?.title) {
      try {
        await axios.post('/shoppingList', {
          userId: user._id,
          recipeName: recipe.title,
          ingredients: recipe.ingredients,
        });
        alert('Ingredients added to shopping list!');
      } catch (err) {
        console.error('Failed to save shopping list:', err);
        alert('Failed to save shopping list.');
      }
    }
  };

  // --- Local storage sync for guests ---
  useEffect(() => {
    if (!user) {
      const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
      setFavorites(savedFavs);
    }
    const savedList = JSON.parse(localStorage.getItem('shoppingList')) || [];
    setShoppingList(savedList);
  }, [user]);

  useEffect(() => {
    if (!user) localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites, user]);

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // --- Fetch favorites for logged-in users ---
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?._id) return;
      try {
        const res = await axios.get(`/favorites/${user._id}`);
        setFavorites(res.data.favorites || []);
      } catch (err) {
        console.error('Failed to load favorites:', err);
      }
    };
    fetchFavorites();
  }, [user]);

  // --- Fetch recipe by ID ---
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`/recipes/${id}`);
        const recipeData = res.data.recipe || res.data;
        setRecipe(recipeData);
      } catch (err) {
        console.error('API Error:', err);
        if (err.response?.status === 404) setError('Recipe not found');
        else setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRecipe();
  }, [id]);

  if (loading) return <p>Loading recipe...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!recipe) return <p>No recipe found.</p>;

  const isFavorited = favorites.some(fav => getRecipeId(fav) === getRecipeId(recipe));
  const steps = formatInstructions(recipe.instructions);

  return (
    <div style={{ padding: '20px' }}>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/">← Back to Recipes</Link>
      </nav>

      <div className="recipe-detail">
        <h1>{recipe.title}</h1>
        {recipe.image && (
          <img className="recipe-image" src={recipe.image} alt={recipe.title} />
        )}

        <div className="recipe-actions">
          {isFavorited ? (
            <button className="favorite-btn remove" onClick={handleRemoveFromFavorites}>
              Remove from Favorites
            </button>
          ) : (
            <button className="favorite-btn" onClick={handleAddToFavorites}>
              Add to Favorites
            </button>
          )}
          <button className="shopping-btn" onClick={handleAddToShoppingList}>
            Add to Shopping List
          </button>
        </div>

        <div className="linked-buttons" style={{ marginTop: '1rem' }}>
          <Link to="/favorites" className="link-btn">
            View Favorites
          </Link>
          <Link to="/shoppingList" className="link-btn" style={{ marginLeft: '1rem' }}>
            View Shopping List
          </Link>
        </div>

        <h2>Ingredients</h2>
        <ul>
          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            recipe.ingredients.map((item, index) => <li key={index}>{item}</li>)
          ) : (
            <li>No ingredients available</li>
          )}
        </ul>

        <h2>Instructions</h2>
        {steps.length > 0 ? (
          <ol className="instructions-list">
            {steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        ) : (
          <p>No instructions available.</p>
        )}
      </div>
    </div>
  );
}