import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import LogoutButton from './LogoutButton.jsx';
import { AuthContext } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { user } = useContext(AuthContext);

  return (
    <nav>
      <Link to="/">Home</Link>
      {user ? (
        <>
          <span>Welcome, {user.username || 'Guest'}</span>
          <LogoutButton />
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/guest">Guest</Link>
          <Link to="/shopping-list">Shopping List</Link>
        </>
      )}
    </nav>
  );
}
