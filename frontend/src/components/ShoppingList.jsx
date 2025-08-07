import React, { useEffect, useState, useContext } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext'; // Adjust path as needed

export default function ShoppingList() {
  const { user } = useContext(AuthContext);
  const [shoppingList, setShoppingList] = useState([]);

  useEffect(() => {
    if (!user) return; // Don't try fetching if user not loaded yet

    axios.get(`/shoppingList/${user._id}`) // <-- use actual logged-in user ID
      .then(res => {
        setShoppingList(res.data.list || []);
      })
      .catch(err => {
        console.error('Error fetching shopping list:', err);
      });
  }, [user]); // re-run effect when `user` is set

  if (!user) return <p>Loading user...</p>;

  if (shoppingList.length === 0) {
    return <p>No ingredients in your shopping list.</p>;
  }

  return (
    <div>
      <h2>Shopping List</h2>
      {shoppingList.map((recipe, idx) => (
        <div key={idx} style={{ marginBottom: '1rem' }}>
          <h3>{recipe.recipeName}</h3>
          <ul>
            {[...new Set(recipe.ingredients)].map((ingredient, i) => (
              <li key={i}>🛒 {ingredient}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
