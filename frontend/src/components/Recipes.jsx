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
  const [favorites, setFavorites] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'favorites', 'shopping'

  useEffect(() => {
    const savedFavs = JSON.parse(localStorage.getItem('favorites')) || [];
    const savedList = JSON.parse(localStorage.getItem('shoppingList')) || [];
    setFavorites(savedFavs);
    setShoppingList(savedList);
  }, []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

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
      setViewMode('all');
    } catch (err) {
      setError('Failed to load random recipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const filteredRecipes = (viewMode === 'favorites' ? favorites : recipes).filter(recipe => {
    const title = recipe.title || recipe.strMeal || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // === UI ===
  return (
    <div>
      <h1>
        {viewMode === 'favorites' && 'Favorite Recipes'}
        {viewMode === 'shopping' && 'Shopping List'}
        {viewMode === 'all' && `Recipes ${category ? `- ${category}` : ''}`}
      </h1>

      {/* View Mode Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => {
            setViewMode('all');
            setCategory('');
            fetchRecipes('');
            setSearchTerm('');
          }}
          style={{
            marginRight: '10px',
            padding: '5px 10px',
            backgroundColor: viewMode === 'all' ? '#007bff' : '#f8f9fa',
            color: viewMode === 'all' ? 'white' : 'black'
          }}
        >
          All Recipes
        </button>


        {/* Favorites Button */}
        <button
          onClick={() => {
            setViewMode('favorites');
            setSearchTerm('');
          }}
          style={{
            marginRight: '10px',
            padding: '5px 10px',
            backgroundColor: viewMode === 'favorites' ? '#007bff' : '#f8f9fa',
            color: viewMode === 'favorites' ? 'white' : 'black'
          }}
        >
          Favorites
        </button>


       {/* Shopping List Button */}
        <button
          onClick={() => {
            // 🔄 Re-load from localStorage every time you enter shopping view
            const savedList = JSON.parse(localStorage.getItem('shoppingList')) || [];
            setShoppingList(savedList);

            setViewMode('shopping');
            setSearchTerm('');
          }}
          style={{
            marginRight: '10px',
            padding: '5px 10px',
            backgroundColor: viewMode === 'shopping' ? '#007bff' : '#f8f9fa',
            color: viewMode === 'shopping' ? 'white' : 'black'
          }}
        >
          Shopping List
        </button>

        <button
          onClick={fetchRandomRecipe}
          style={{ padding: '5px 10px' }}
        >
          Surprise Me
        </button>
      </div>

      {/* Category Buttons */}
      {viewMode === 'all' && (
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
      )}

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
      {fromCache && viewMode === 'all' && (
        <p style={{ fontStyle: 'italic', color: 'gray' }}>Loaded from cache</p>
      )}

      {/* Shopping List View */}
      {viewMode === 'shopping' && (
        <div style={{ marginTop: '20px' }}>
          {shoppingList.length === 0 ? (
            <p>No ingredients in your shopping list.</p>
          ) : (
            <ul style={{ lineHeight: '1.8em' }}>
              {[...new Set(shoppingList)].map((item, idx) => (
                <li key={idx}>🛒 {item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Recipes Grid */}
      {viewMode !== 'shopping' && (
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
      )}
    </div>
  );
}
