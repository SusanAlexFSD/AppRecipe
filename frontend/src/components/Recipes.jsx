import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/Recipes.css';

const categories = ['Beef', 'Breakfast', 'Chicken', 'Dessert', 'Lamb', 'Pasta', 'Pork', 'Seafood', 'Vegan', 'Vegetarian'];

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromCache, setFromCache] = useState(false);

  const fetchRecipes = async (cat = '') => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/recipes';
      if (cat) {
        url = `/api/recipes/category/${cat.toLowerCase()}`;
      }
      const res = await axios.get(url);
      setRecipes(res.data.recipes || res.data);
      setFromCache(res.data.fromCache || false);
    } catch (err) {
      setError('Failed to load recipes.');
    }
    setLoading(false);
  };

  // Fetch random recipe for "Surprise Me"
  const fetchRandomRecipe = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/recipes/random');
      // Show just that one random recipe
      setRecipes([res.data.recipe || res.data]);
      setCategory('');
      setSearchTerm('');
      setFromCache(false);
    } catch (err) {
      setError('Failed to load random recipe.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Filter recipes locally by searchTerm
  const filteredRecipes = recipes.filter(recipe => {
    const title = recipe.title || recipe.strMeal || '';
    return title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <h1>Recipes {category && `- ${category}`}</h1>

      {/* Category buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => { setCategory(''); fetchRecipes(''); }} disabled={!category}>All</button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              fetchRecipes(cat);
              setSearchTerm('');
            }}
            disabled={category === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search recipes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '10px', padding: '5px', width: '100%', maxWidth: '300px' }}
      />

      {/* Surprise Me button */}
      <button onClick={fetchRandomRecipe} style={{ marginLeft: '10px', padding: '5px 10px' }}>
        Surprise Me
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {fromCache && <p style={{ fontStyle: 'italic', color: 'gray' }}>Loaded from cache</p>}

      {/* Recipe list */}
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {filteredRecipes.map(recipe => {
          const id = recipe._id || recipe.apiId || recipe.idMeal || recipe.id;
          const title = recipe.title || recipe.strMeal;
          const image = recipe.image || recipe.strMealThumb;

          return (
            <li key={id} style={{ border: '1px solid #ccc', padding: '10px', width: '200px' }}>
              <h3>{title}</h3>
              {image && <img src={image} alt={title} width="180" />}
              <Link to={`/recipe/${id}`}>
                <button style={{ marginTop: '10px' }}>View Recipe</button>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
