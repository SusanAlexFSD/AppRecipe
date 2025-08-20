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

  // Add to Favorites
  const handleAddToFavorites = async () => {
    if (!recipe) return;

    const userId = user?._id || null;
    // Always use apiId for consistency
    const recipeId = recipe.apiId || recipe.id || recipe._id;

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
      } else {
        // For guests, add to localStorage
        const updatedFavorites = [...favorites, recipe];
        setFavorites(updatedFavorites);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      }

      setFavorites((prev) => [...prev, recipe]);
      alert('Added to favorites!');
    } catch (err) {
      console.error('Failed to add to favorites:', err);
      alert('Failed to add to favorites.');
    }
  };

  // Remove from Favorites
  const handleRemoveFromFavorites = async () => {
    if (!recipe) return;

    const userId = user?._id || null;
    const recipeId = getRecipeId(recipe);

    try {
      if (userId) {
        await axios.delete('/favorites/remove', {
          data: { userId, recipeId },
        });
      } else {
        // For guests, update localStorage
        const updatedFavorites = favorites.filter((fav) => getRecipeId(fav) !== recipeId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      }

      setFavorites((prev) =>
        prev.filter((fav) => getRecipeId(fav) !== recipeId)
      );
      alert('Removed from favorites!');
    } catch (err) {
      console.error('Failed to remove from favorites:', err);
      alert('Failed to remove from favorites.');
    }
  };

  // Add to Shopping List
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

  // Load favorites and shopping list from localStorage for guests
  useEffect(() => {
    if (!user) {
      const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
      setFavorites(savedFavs);
    }

    const savedList = JSON.parse(localStorage.getItem('shoppingList')) || [];
    setShoppingList(savedList);
  }, [user]);

  // Save favorites to localStorage only for guests
  useEffect(() => {
    if (!user) {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }, [favorites, user]);

  // Save shopping list to localStorage for everyone
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // Fetch favorites for logged-in users
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

  // Fetch recipe by ID - FIXED: Use axios instance instead of hardcoded URL
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Use the axios instance from your api/axios file instead of hardcoded URL
        const res = await axios.get(`/recipes/${id}`);
        
        // Handle both response formats (with or without .recipe wrapper)
        const recipeData = res.data.recipe || res.data;
        setRecipe(recipeData);
      } catch (err) {
        console.error('API Error:', err);
        if (err.response?.status === 404) {
          setError('Recipe not found');
        } else {
          setError('Failed to load recipe');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipe();
    }
  }, [id]);

  if (loading) return <p>Loading recipe...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!recipe) return <p>No recipe found.</p>;

  const isFavorited = favorites.some(
    (fav) => getRecipeId(fav) === getRecipeId(recipe)
  );

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
            <button
              className="favorite-btn remove"
              onClick={handleRemoveFromFavorites}
            >
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
        <p>{recipe.instructions || 'No instructions available.'}</p>
      </div>
    </div>
  );
}