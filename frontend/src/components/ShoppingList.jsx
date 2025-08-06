import React, { useEffect, useState } from 'react';
import axios from '../api/axios';

export default function ShoppingList() {
  const [shoppingList, setShoppingList] = useState([]);

  useEffect(() => {
    // Replace 'user123' with actual user ID from context or props
    axios.get('/shoppingList/user123')
      .then(res => {
        setShoppingList(res.data.list || []);
      })
      .catch(err => {
        console.error('Error fetching shopping list:', err);
      });
  }, []);

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
