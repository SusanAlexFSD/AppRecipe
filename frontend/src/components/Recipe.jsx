import React from 'react';
import { useParams } from 'react-router-dom';

export default function Recipe() {
  const { id } = useParams();

  return (
    <div>
      <h2>Recipe Detail Page</h2>
      <p>Recipe ID: {id}</p>
    </div>
  );
}