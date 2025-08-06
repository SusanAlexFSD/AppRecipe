import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('favorites')) || [];
    setFavorites(saved);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <nav style={{ marginBottom: '20px' }}>
        <Link to="/">← Back to Recipes</Link>
      </nav>

      <h1>My Favorite Recipes</h1>

      {favorites.length === 0 ? (
        <p style={{ color: '#777' }}>You haven't added any favorites yet.</p>
      ) : (
        <div className="recipe-grid">
          {favorites.map((recipe) => {
            const id = recipe.apiId || recipe.idMeal || recipe._id;
            const title = recipe.title || recipe.strMeal;
            const image = recipe.image || recipe.strMealThumb;

            return (
              <div key={id} className="recipe-card">
                <h3>{title}</h3>
                {image && (
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
