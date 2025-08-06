import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Link } from 'react-router-dom';
import './Recipes.css';

const categories = [
  'Beef', 'Breakfast', 'Chicken', 'Dessert',
  'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegan', 'Vegetarian'
];

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromCache, setFromCache] = useState(false);

  // We no longer need viewMode/favorites/shoppingList state here since those views are on separate routes

  const fetchRecipes = async (cat = '') => {
    setLoading(true);
    setError('');
    const cacheKey = cat ? `recipes_${cat.toLowerCase()}` : 'recipes_all';

    try {
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const cachedData = JSON.parse(cached);
        const firstItem = cachedData[0];
        const hasValidData = firstItem && (
          (firstItem.title && firstItem.image) ||
          (firstItem.strMeal && firstItem.strMealThumb)
        );

        if (hasValidData) {
          setRecipes(cachedData);
          setFromCache(true);
          setLoading(false);
          return;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }

      let url = '/api/recipes';
      if (cat) url = `/api/recipes/category/${cat.toLowerCase()}`;

      const res = await axios.get('http://localhost:5000' + url);
      const data = res.data.recipes || res.data;
      setRecipes(data);
      setFromCache(res.data.fromCache || false);

      const firstItem = data[0];
      const isValidData = firstItem && (
        (firstItem.title && firstItem.image) ||
        (firstItem.strMeal && firstItem.strMealThumb)
      );

      if (data && data.length > 0 && isValidData) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err) {
      setError('Failed to load recipes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRandomRecipe = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:5000/api/recipes/random');
      const recipe = res.data.recipe || res.data;
      setRecipes([recipe]);
      setCategory('');
      setSearchTerm('');
      setFromCache(false);
    } catch (err) {
      setError('Failed to load random recipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Filter recipes for search term
  const filteredRecipes = recipes.filter(recipe => {
    const title = recipe.title || recipe.strMeal || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <h1>
        Recipes {category ? `- ${category}` : ''}
      </h1>

      {/* Navigation Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            setCategory('');
            fetchRecipes('');
            setSearchTerm('');
          }}
          style={{
            marginRight: '10px',
            padding: '5px 10px',
            backgroundColor: !category ? '#007bff' : '#f8f9fa',
            color: !category ? 'white' : 'black'
          }}
        >
          All Recipes
        </button>

        {/* Link to Favorites Page */}
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

        {/* Link to Shopping List Page */}
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

        <button
          onClick={fetchRandomRecipe}
          style={{ padding: '5px 10px' }}
        >
          Surprise Me
        </button>
      </div>

      {/* Category Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            setCategory('');
            fetchRecipes('');
            setSearchTerm('');
          }}
          disabled={!category}
          style={{ marginRight: '5px', padding: '5px 10px' }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              fetchRecipes(cat);
              setSearchTerm('');
            }}
            style={{
              marginRight: '5px',
              padding: '5px 10px',
              backgroundColor: category === cat ? '#007bff' : '#f8f9fa',
              color: category === cat ? 'white' : 'black'
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
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '5px', width: '100%', maxWidth: '300px' }}
        />
      </div>

      {/* Status Messages */}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {fromCache && (
        <p style={{ fontStyle: 'italic', color: 'gray' }}>Loaded from cache</p>
      )}

      {/* Recipes Grid */}
      <div className="recipe-grid">
        {filteredRecipes.map(recipe => {
          const id = recipe.apiId || recipe.idMeal || recipe._id;
          const title = recipe.title || recipe.strMeal || 'Untitled';
          const image = recipe.image || recipe.strMealThumb || '';

          return (
            <div className="recipe-card" key={id}>
              <h3>{title}</h3>
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
                  marginBottom: '10px'
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