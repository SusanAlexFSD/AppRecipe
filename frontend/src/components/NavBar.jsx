import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import './NavBar.css';


export default function NavBar() {
  const { user } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="nav-logo">🍳 Recipe Finder</div>

        <Link to="/" className="nav-link">Home</Link>

        {user ? (
          <>
            <Link to="/favorites" className="nav-link">Favorites</Link>
            <Link to="/shoppingList" className="nav-link">Shopping List</Link>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
            <Link to="/guest" className="nav-link">Guest</Link>
          </>
        )}
      </div>

      {user && (
        <div className="nav-right">
          <span className="welcome-text">
            👋 Welcome, {user.username || user.email || 'User'}
          </span>
          <LogoutButton />
        </div>
      )}
    </nav>
  );
}
