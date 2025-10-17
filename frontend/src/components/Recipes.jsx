// src/components/Recipes.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios'; // your configured axios instance
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

  // Refs for debounce/abort
  const fetchAbortRef = useRef(null);
  const searchAbortRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // === Helper: API GET request ===
  const apiGet = async (path, { params = {}, signal } = {}) => {
    try {
      const config = { params, signal };
      const res = await axios.get(path, config);
      return res.data;
    } catch (err) {
      if (err.response) {
        throw new Error(`Request failed: ${err.response.status} ${err.response.statusText}`);
      } else if (err.request) {
        throw new Error('No response received from server');
      } else {
        throw new Error(`Request error: ${err.message}`);
      }
    }
  };

  // === Fetch all recipes on mount ===
  useEffect(() => {
    fetchAllRecipes();

    return () => {
      if (fetchAbortRef.current) fetchAbortRef.current.abort();
      if (searchAbortRef.current) searchAbortRef.current.abort();
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const fetchAllRecipes = async () => {
    setLoading(true);
    setError('');
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const data = await apiGet('/recipes', { params: { limit: 10000 }, signal: controller.signal });
      const normalized = Array.isArray(data) ? data : data.recipes || [];
      setAllRecipes(normalized);
      setRecipes(normalized);
      setCategory('');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setError('Failed to load recipes.');
      }
    } finally {
      setLoading(false);
      fetchAbortRef.current = null;
    }
  };

  // === Fetch recipes by category ===
  const fetchRecipesByCategory = async (cat = '') => {
    setSearchTerm('');
    if (!cat) {
      setRecipes(allRecipes);
      setCategory('');
      return;
    }

    setLoading(true);
    setError('');
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const data = await apiGet(`/recipes/category/${encodeURIComponent(cat.toLowerCase())}`, { signal: controller.signal });
      const categoryRecipes = Array.isArray(data) ? data : data.recipes || [];
      setRecipes(categoryRecipes);
      setCategory(cat);

      // Merge into allRecipes
      setAllRecipes(prev => {
        const map = new Map(prev.map(r => [r.apiId || r.idMeal || r._id, r]));
        categoryRecipes.forEach(r => {
          const key = r.apiId || r.idMeal || r._id;
          if (key) map.set(key, r);
        });
        return Array.from(map.values());
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setError('Failed to load category recipes.');
      }
    } finally {
      setLoading(false);
      fetchAbortRef.current = null;
    }
  };

  // === Debounced search ===
  useEffect(() => {
    const q = searchTerm.trim();
    if (!q) {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      setSearchLoading(false);
      setError('');
      setRecipes(category ? recipes : allRecipes);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      if (searchAbortRef.current) searchAbortRef.current.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setSearchLoading(true);
      setError('');

      try {
        const data = await apiGet('/recipes/search', { params: { q }, signal: controller.signal });
        const normalized = Array.isArray(data) ? data : data.recipes || [];
        setRecipes(normalized);

        setAllRecipes(prev => {
          const map = new Map(prev.map(r => [r.apiId || r.idMeal || r._id, r]));
          normalized.forEach(r => {
            const key = r.apiId || r.idMeal || r._id;
            if (key) map.set(key, r);
          });
          return Array.from(map.values());
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError('Search failed. Please try again.');
        }
      } finally {
        setSearchLoading(false);
        searchAbortRef.current = null;
      }
    }, 500);

    return () => clearTimeout(searchDebounceRef.current);
  }, [searchTerm, category, allRecipes]);

  // === UI helpers ===
  const displayCategory = searchTerm ? 'Search Results' : category;
  const isBusy = loading || searchLoading;

  return (
    <div>
      <h1>Recipes {displayCategory ? `- ${displayCategory}` : ''}</h1>

      {/* Navigation */}
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

        <Link to="/favorites"><button className="nav-btn favorite">Favorites</button></Link>
        <Link to="/shoppingList"><button className="nav-btn shopping">Shopping List</button></Link>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => fetchRecipesByCategory('')} disabled={!category && !searchTerm}>All</button>
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
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', width: '100%', maxWidth: '400px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        {searchLoading && <span style={{ marginLeft: '10px', color: '#666' }}>Searching...</span>}
      </div>

      {/* Status messages */}
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
                <img src={image} alt={title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
              ) : (
                <div style={{ height: '200px', backgroundColor: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', color: '#666' }}>
                  No image available
                </div>
              )}
              <Link to={`/recipe/${id}`}>
                <button style={{ width: '100%', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
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
