import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user } = useContext(AuthContext);

  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>Home</Link>

      {user ? (
        <>
          <Link to="/favorites" style={{ marginRight: '1rem' }}>Favorites</Link>
          <Link to="/shoppingList" style={{ marginRight: '1rem' }}>Shopping List</Link>
          <span style={{ marginRight: '1rem' }}>
            👋 Welcome, {user.username || user.email || 'User'}
          </span>
          <LogoutButton />
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
          <Link to="/register" style={{ marginRight: '1rem' }}>Register</Link>
          <Link to="/guest">Guest</Link>
        </>
      )}
    </nav>
  );
}
