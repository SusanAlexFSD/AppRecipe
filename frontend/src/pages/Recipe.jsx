import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Recipe.css';


export default function Recipe() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
