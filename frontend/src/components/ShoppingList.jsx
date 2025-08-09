import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function ShoppingList() {
  const { user } = useContext(AuthContext);
  const [shoppingList, setShoppingList] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchList();
  }, [user]);

  const fetchList = () => {
    axios.get(`/shoppingList/${user._id}`)
      .then(res => setShoppingList(res.data.list || []))
      .catch(err => console.error('Error fetching shopping list:', err));
  };

  // Remove a specific recipe
  const removeRecipe = (recipeName) => {
    axios.delete(`/shoppingList/${user._id}/${encodeURIComponent(recipeName)}`)
      .then(res => setShoppingList(res.data.list || []))
      .catch(err => console.error('Error removing recipe:', err));
  };

  // Clear all recipes
  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear the entire list?')) {
      axios.delete(`/shoppingList/${user._id}`)
        .then(() => setShoppingList([]))
        .catch(err => console.error('Error clearing list:', err));
    }
  };

  if (!user) return <p>Loading user...</p>;
  if (shoppingList.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/">← Back to Recipes</Link>
        </nav>
        <p>No ingredients in your shopping list.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/">← Back to Recipes</Link>
      </nav>

      <h2>Shopping List</h2>
      <button
        onClick={clearAll}
        style={{ background: 'red', color: 'white', marginBottom: '1rem' }}
      >
        Clear All
      </button>

      {shoppingList.map((recipe, idx) => (
        <div
          key={idx}
          style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>{recipe.recipeName}</h3>
            <button
              onClick={() => removeRecipe(recipe.recipeName)}
              style={{ background: 'tomato', color: 'white' }}
            >
              Remove Recipe
            </button>
          </div>
          <ul>
            {[...new Set(recipe.ingredients)].map((ingredient, i) => (
              <li key={i}>🛒 {ingredient}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
