import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (user?._id) {
        // Logged-in user – fetch from backend
        try {
          const res = await axios.get(`/favorites/${user._id}`);
          setFavorites(res.data.favorites || []);
        } catch (error) {
          console.error('Failed to fetch favorites from DB:', error);
        }
      } else {
        // Guest – load from localStorage
        const saved = JSON.parse(localStorage.getItem('favorites')) || [];
        setFavorites(saved);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRemove = async (recipeId) => {
    const userId = user?._id || null;

    try {
      if (userId) {
        // Logged-in user – remove from DB
        await axios.delete('/favorites/remove', {
          data: { userId, recipeId },
        });
      }

      // Update UI state (both guest and logged-in)
      setFavorites((prev) =>
        prev.filter((fav) => (fav.recipeId || fav._id || fav.apiId || fav.id) !== recipeId)
      );

      // For guests, update localStorage
      if (!userId) {
        const updated = favorites.filter(
          (fav) => (fav.recipeId || fav._id || fav.apiId || fav.id) !== recipeId
        );
        localStorage.setItem('favorites', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('Failed to remove favorite.');
    }
  };

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
            const id = recipe.recipeId || recipe.apiId || recipe.idMeal || recipe._id || recipe.id;
            const title = recipe.recipeTitle || recipe.title || recipe.strMeal;
            const image = recipe.recipeImage || recipe.image || recipe.strMealThumb;

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
                <button
                  onClick={() => handleRemove(id)}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '8px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Remove from Favorites
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}