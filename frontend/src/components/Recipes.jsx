// src/components/Recipes.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api/recipes';
import './Recipes.css';

const categories = [
  'Beef', 'Breakfast', 'Chicken', 'Dessert',
  'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegan', 'Vegetarian'
];

export default function Recipes() {
  // Data state
  const [allRecipes, setAllRecipes] = useState([]);
  const [recipes, setRecipes] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Refs for debouncing/cancelling
  const searchDebounceRef = useRef(null);

  // Fetch all recipes on mount
  useEffect(() => {
    fetchAllRecipes();
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const fetchAllRecipes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getRecipes();
      setAllRecipes(data || []);
      setRecipes(data || []);
      setCategory('');
    } catch (err) {
      console.error(err);
      setError('Failed to load recipes.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipes by category
  const fetchRecipesByCategory = async (cat = '') => {
    setSearchTerm('');
    if (!cat) {
      setRecipes(allRecipes);
      setCategory('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.getRecipes(); // For simplicity, serverless function can filter by category if implemented
      const filtered = data.filter(r =>
        (r.category || r.strCategory || '').toLowerCase() === cat.toLowerCase()
      );
      setRecipes(filtered);
      setCategory(cat);
    } catch (err) {
      console.error(err);
      setError('Failed to load category recipes.');
    } finally {
      setLoading(false);
    }
  };

  // Search recipes
  useEffect(() => {
    const q = searchTerm.trim();
    if (q === '') {
      setRecipes(category ? recipes : allRecipes);
      setSearchLoading(false);
      setError('');
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setError('');
      try {
        const data = await api.getRecipes(); // Replace with search serverless function if needed
        const filtered = data.filter(r =>
          (r.title || r.strMeal || '').toLowerCase().includes(q.toLowerCase())
        );
        setRecipes(filtered);
      } catch (err) {
        console.error(err);
        setError('Search failed.');
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchTerm, category, allRecipes]);

  const displayCategory = searchTerm ? 'Search Results' : category;
  const isBusy = loading || searchLoading;

  return (
    <div>
      <h1>
        Recipes {displayCategory ? `- ${displayCategory}` : ''}
      </h1>

      {/* Navigation Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => fetchRecipesByCategory('')}
          style={{
            marginRight: '10px',
            padding: '5px 10px',
            backgroundColor: !category && !searchTerm ? '#007bff' : '#f8f9fa',
            color: !category && !searchTerm ? 'white' : 'black'
          }}
        >
          All Recipes
        </button>

        <Link to="/favorites">
          <button
            style={{
              marginRight: '10px',
              padding: '5px 10px',
              backgroundColor: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Favorites
          </button>
        </Link>

        <Link to="/shoppingList">
          <button
            style={{
              marginRight: '10px',
              padding: '5px 10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Shopping List
          </button>
        </Link>
      </div>

      {/* Category Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => fetchRecipesByCategory('')}
          disabled={!category && !searchTerm}
          style={{ marginRight: '5px', padding: '5px 10px' }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => fetchRecipesByCategory(cat)}
            style={{
              marginRight: '5px',
              padding: '5px 10px',
              backgroundColor: !searchTerm && category === cat ? '#007bff' : '#f8f9fa',
              color: !searchTerm && category === cat ? 'white' : 'black'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search recipes by name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', width: '100%', maxWidth: '400px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        {searchLoading && <span style={{ marginLeft: '10px', color: '#666' }}>Searching...</span>}
      </div>

      {/* Status Messages */}
      {isBusy && !searchLoading && <p style={{ color: '#666' }}>Loading recipes...</p>}
      {error && <p style={{ color: 'red', backgroundColor: '#ffeaa7', padding: '10px', borderRadius: '4px' }}>{error}</p>}

      {/* Recipes Grid */}
      <div className="recipe-grid">
        {!isBusy && recipes.length === 0 && (
          <p style={{ color: '#666', fontSize: '18px', textAlign: 'center', marginTop: '40px' }}>
            {searchTerm ? `No recipes found for "${searchTerm}"` : 'No recipes found.'}
          </p>
        )}

        {recipes.map(recipe => {
          const id = recipe.apiId || recipe.idMeal || recipe._id;
          const title = recipe.title || recipe.strMeal || 'Untitled';
          const image = recipe.image || recipe.strMealThumb || '';

          return (
            <div className="recipe-card" key={id || title}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{title}</h3>
              {image ? (
                <img
                  src={image}
                  alt={title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '10px',
                  }}
                />
              ) : (
                <div style={{
                  height: '200px',
                  backgroundColor: '#eee',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  color: '#666'
                }}>
                  No image available
                </div>
              )}
              <Link to={`/recipe/${id}`}>
                <button
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  View Recipe
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
