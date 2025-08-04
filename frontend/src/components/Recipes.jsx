import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  const fetchRecipes = async (cat = '') => {
    console.log('Fetching recipes for:', cat);
    setLoading(true);
    setError('');

    try {
      // Check cache first
      const cacheKey = cat ? `recipes_${cat.toLowerCase()}` : 'recipes_all';
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const cachedData = JSON.parse(cached);
        
        // Validate cached data has required fields (handle both formats)
        const firstItem = cachedData[0];
        const hasValidData = firstItem && (
          (firstItem.title && firstItem.image) ||  // Our transformed format
          (firstItem.strMeal && firstItem.strMealThumb)  // Raw API format
        );
        
        if (hasValidData) {
          console.log('Loaded from localStorage:', cacheKey);
          setRecipes(cachedData);
          setFromCache(true);
          setLoading(false);
          return;
        } else {
          // Clear invalid cache
          localStorage.removeItem(cacheKey);
          console.log('Cleared invalid cache for:', cacheKey);
        }
      }

      // Fetch from server
      let url = '/api/recipes';
      if (cat) url = `/api/recipes/category/${cat.toLowerCase()}`;

      const res = await axios.get('http://localhost:5000' + url);
      
      console.log('=== SERVER RESPONSE ===');
      console.log('Full response:', res.data);
      
      const data = res.data.recipes || res.data;
      console.log('Extracted data:', data);
      console.log('First recipe from server:', data[0]);

      setRecipes(data);
      setFromCache(res.data.fromCache || false);

      // Cache only if data looks valid (handle both formats)
      const firstItem = data[0];
      const isValidData = firstItem && (
        (firstItem.title && firstItem.image) ||  // Our transformed format
        (firstItem.strMeal && firstItem.strMealThumb)  // Raw API format  
      );
      
      if (data && data.length > 0 && isValidData) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        console.log('Cached valid data for:', cacheKey);
      } else {
        console.warn('Server data invalid, not caching:', data[0]);
      }
    } catch (err) {
      console.error('Error fetching recipes:', err);
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
      console.error('Error fetching random recipe:', err);
      setError('Failed to load random recipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const filteredRecipes = recipes.filter(recipe => {
    const title = recipe.title || recipe.strMeal || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <h1>Recipes {category && `- ${category}`}</h1>

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

      {/* Search + Controls */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '5px', width: '100%', maxWidth: '300px', marginRight: '10px' }}
        />
        <button 
          onClick={fetchRandomRecipe} 
          style={{ marginRight: '10px', padding: '5px 10px' }}
        >
          Surprise Me
        </button>
      </div>

      {/* Status Messages */}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {fromCache && <p style={{ fontStyle: 'italic', color: 'gray' }}>Loaded from cache</p>}
      
      {/* Results Info */}
      {recipes.length > 0 && !loading && (
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Showing {filteredRecipes.length} of {recipes.length} recipes
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      )}

      {/* No Results */}
      {!loading && recipes.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
          No recipes found. Try selecting a different category.
        </p>
      )}

      {/* Recipe Grid */}
      <div className="recipe-grid">
        {filteredRecipes.map(recipe => {
          // Use apiId as primary identifier for routing
          const id = recipe.apiId || recipe.idMeal || recipe._id || Math.random();
          // Handle both transformed (title/image) and raw API (strMeal/strMealThumb) formats
          const title = recipe.title || recipe.strMeal || 'Untitled Recipe';
          const image = recipe.image || recipe.strMealThumb || '';

          console.log('Rendering recipe:', { id, title, image, raw: recipe }); // Debug line

          return (
            <div className="recipe-card" key={id}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1em' }}>{title}</h3>
              {image ? (
                <img 
                  src={image} 
                  alt={title} 
                  style={{ 
                    width: '100%', 
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              {!image && (
                <div style={{ 
                  width: '100%', 
                  height: '200px', 
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  color: '#666'
                }}>
                  No image available
                </div>
              )}
              <Link to={`/recipe/${recipe.apiId}`}>
                <button style={{ 
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
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