import React, { useEffect, useState } from 'react';

export default function ShoppingList() {
  const [shoppingList, setShoppingList] = useState([]);

  useEffect(() => {
    const savedList = JSON.parse(localStorage.getItem('shoppingList')) || [];
    setShoppingList(savedList);
  }, []);

  if (shoppingList.length === 0) {
    return <p>No ingredients in your shopping list.</p>;
  }

  return (
    <div>
      <h2>Shopping List</h2>
      <ul>
        {[...new Set(shoppingList)].map((item, idx) => (
          <li key={idx}>🛒 {item}</li>
        ))}
      </ul>
    </div>
  );
}
