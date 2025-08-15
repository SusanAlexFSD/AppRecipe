// src/components/Recipes.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Recipes.css';

const categories = [
  'Beef', 'Breakfast', 'Chicken', 'Dessert',
  'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegan', 'Vegetarian'
];

export default function Recipes() {
  // data
  const [allRecipes, setAllRecipes] = useState([]); // accumulated dataset
  const [recipes, setRecipes] = useState([]);       // what we display (category/search/all)
  // UI state
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // refs for debouncing/cancelling
  const searchAbortRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const fetchAbortRef = useRef(null);

  // Get axiosInstance from AuthContext
  const auth = useAuth();
  const axiosInstance = auth && (auth.axiosInstance || auth.axios) ? (auth.axiosInstance || auth.axios) : null;

  // Helper to perform GET requests using axiosInstance if available, otherwise fetch.
  async function apiGet(path, { params = {}, signal } = {}) {
    if (axiosInstance) {
      const config = {};
      if (signal) config.signal = signal;
      if (params && Object.keys(params).length) config.params = params;
      const res = await axiosInstance.get(path, config);
      return res.data;
    }

    // Fallback to fetch
    const url = new URL((path.startsWith('/') ? path : `/${path}`), window.location.origin);
    if (!url.pathname.startsWith('/api')) {
      url.pathname = `/api${url.pathname}`;
    }
    Object.keys(params || {}).forEach(key => url.searchParams.append(key, params[key]));
    const res = await fetch(url.toString(), { method: 'GET', signal });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Request failed ${res.status} ${res.statusText} ${text}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    return res.text();
  }

  // On mount, fetch initial dataset
  useEffect(() => {
    fetchAllRecipes();

    return () => {
      // cleanup any in-flight requests
      if (searchAbortRef.current) {
        try { searchAbortRef.current.abort(); } catch {}
      }
      if (fetchAbortRef.current) {
        try { fetchAbortRef.current.abort(); } catch {}
      }
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Fetch initial recipes (server endpoint: GET /api/recipes)
  const fetchAllRecipes = async () => {
    setLoading(true);
    setError('');
    // abort any previous fetch
    if (fetchAbortRef.current) {
      try { fetchAbortRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const data = await apiGet('/recipes', { signal: controller.signal });
      const normalized = Array.isArray(data) ? data : (data.recipes || data);
      setAllRecipes(normalized || []);
      setRecipes(normalized || []);
      setCategory('');
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        // ignore abort - this is expected behavior
        console.log('fetchAllRecipes request was cancelled');
      } else {
        console.error('fetchAllRecipes error', err);
        setError('Failed to load all recipes.');
      }
    } finally {
      setLoading(false);
      fetchAbortRef.current = null;
    }
  };

  // Fetch recipes for a category and merge them into allRecipes
  const fetchRecipes = async (cat = '') => {
    setSearchTerm(''); // Clear search when selecting category
    if (!cat) {
      setRecipes(allRecipes);
      setCategory('');
      return;
    }

    setLoading(true);
    setError('');
    // abort any previous fetch
    if (fetchAbortRef.current) {
      try { fetchAbortRef.current.abort(); } catch {}
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    try {
      const data = await apiGet(`/recipes/category/${encodeURIComponent(cat.toLowerCase())}`, { signal: controller.signal });
      const categoryRecipes = Array.isArray(data) ? data : (data.recipes || data);
      setRecipes(categoryRecipes || []);
      setCategory(cat);

      // Merge into allRecipes by unique key (apiId / idMeal / _id)
      setAllRecipes(prev => {
        const map = new Map(prev.map(r => [r.apiId || r.idMeal || r._id, r]));
        for (const r of (categoryRecipes || [])) {
          const key = r.apiId || r.idMeal || r._id;
          if (key) map.set(key, r);
        }
        return Array.from(map.values());
      });
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        // ignore abort
        console.log('fetchRecipes request was cancelled');
      } else {
        console.error('fetchRecipes error', err);
        setError('Failed to load category recipes.');
      }
    } finally {
      setLoading(false);
      fetchAbortRef.current = null;
    }
  };

  // Debounced server-side search effect
  useEffect(() => {
    const q = (searchTerm || '').trim();

    // empty query -> show category or all
    if (q === '') {
      // cancel in-flight search
      if (searchAbortRef.current) {
        try { searchAbortRef.current.abort(); } catch {}
        searchAbortRef.current = null;
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      setSearchLoading(false);
      setError('');
      // If a category is selected, keep its recipes shown; otherwise show all
      setRecipes(prev => (category ? prev : allRecipes));
      return;
    }

    // debounce
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      // abort previous search
      if (searchAbortRef.current) {
        try { searchAbortRef.current.abort(); } catch {}
      }
      const controller = new AbortController();
      searchAbortRef.current = controller;

      setSearchLoading(true);
      setError('');
      try {
        const data = await apiGet('/recipes/search', { params: { q }, signal: controller.signal });
        const normalized = Array.isArray(data) ? data : (data.recipes || data);
        setRecipes(normalized || []);

        // Merge search results into allRecipes
        setAllRecipes(prev => {
          const map = new Map(prev.map(r => [r.apiId || r.idMeal || r._id, r]));
          for (const r of (normalized || [])) {
            const key = r.apiId || r.idMeal || r._id;
            if (key) map.set(key, r);
          }
          return Array.from(map.values());
        });
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') {
          // ignore user-aborted request
          console.log('Search request was cancelled');
        } else {
          console.error('Search error', err);
          setError('Search failed. Please try again.');
        }
      } finally {
        setSearchLoading(false);
        searchAbortRef.current = null;
      }
    }, 500); // Increased debounce to 500ms to reduce API calls

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, category, allRecipes]);

  // UI helpers
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
          onClick={() => fetchRecipes('')}
          style={{
            marginRight: '10px',
            padding: '5px 10px',
            backgroundColor: !category && !searchTerm ? '#007bff' : '#f8f9fa',
            color: !category && !searchTerm ? 'white' : 'black'
          }}
        >
          All Recipes
        </button>

        <Link to="/favorites" style={{ textDecoration: 'none' }}>
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

        <Link to="/shoppingList" style={{ textDecoration: 'none' }}>
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
          onClick={() => fetchRecipes('')}
          disabled={!category && !searchTerm}
          style={{ marginRight: '5px', padding: '5px 10px' }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => fetchRecipes(cat)}
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

      {/* Status Messages */}
      {isBusy && !searchLoading && <p style={{ color: '#666' }}>Loading recipes...</p>}
      {error && <p style={{ color: 'red', backgroundColor: '#ffeaa7', padding: '10px', borderRadius: '4px' }}>{error}</p>}

      {/* Results count */}
      {!isBusy && recipes.length > 0 && (
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Showing {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </p>
      )}

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