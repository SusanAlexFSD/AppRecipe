import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Recipe.css';


export default function Recipe() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  // ✅ Handle Favorites
  const handleAddToFavorites = () => {
    if (recipe && !favorites.includes(recipe.id || recipe._id || recipe.apiId)) {
      setFavorites([...favorites, recipe]);
      alert('Added to favorites!');
    }
  };

   // ✅ Handle Shopping List using localStorage directly
  const handleAddToShoppingList = () => {
  if (recipe?.ingredients?.length > 0) {
    const saved = JSON.parse(localStorage.getItem('shoppingList')) || [];
    const updated = [...saved, ...recipe.ingredients];
    localStorage.setItem('shoppingList', JSON.stringify(updated));
    alert('Ingredients added to shopping list!');
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

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/recipes/${id}`);
        setRecipe(res.data.recipe);
      } catch (err) {
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
