import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import './Recipe.css';

export default function Recipe() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  // ✅ Get user from AuthContext
  const { user } = useContext(AuthContext);

  // ✅ Handle Favorites
  const handleAddToFavorites = () => {
    if (recipe && !favorites.includes(recipe.id || recipe._id || recipe.apiId)) {
      setFavorites([...favorites, recipe]);
      alert('Added to favorites!');
    }
  };

  // ✅ Handle Shopping List (MongoDB)
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

  // 🔁 Load from localStorage on mount
  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
    const savedList = JSON.parse(localStorage.getItem('shoppingList')) || [];
    setFavorites(savedFavs);
    setShoppingList(savedList);
  }, []);

  // 💾 Save to localStorage when favorites change
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // 💾 Save to localStorage when shopping list changes
  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  // 🔁 Fetch recipe by ID
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/recipes/${id}`);
        console.log('API Response:', res.data);
        setRecipe(res.data.recipe);
      } catch (err) {
        console.error('API Error:', err);
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (loading) return <p>Loading recipe...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!recipe) return <p>No recipe found.</p>;

  return (
    <div className="recipe-detail">
      <h1>{recipe.title}</h1>
      {recipe.image && <img className="recipe-image" src={recipe.image} alt={recipe.title} />}

      <div className="recipe-actions">
        <button className="favorite-btn" onClick={handleAddToFavorites}>
          ❤️ Add to Favorites
        </button>
        <button className="shopping-btn" onClick={handleAddToShoppingList}>
          🛒 Add to Shopping List
        </button>
      </div>

      {/* Linked buttons to favorites and shopping list pages */}
      <div className="linked-buttons" style={{ marginTop: '1rem' }}>
        <Link to="/favorites" className="link-btn">
          ❤️ View Favorites
        </Link>
        <Link to="/shoppingList" className="link-btn" style={{ marginLeft: '1rem' }}>
          🛒 View Shopping List
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
  );
}
