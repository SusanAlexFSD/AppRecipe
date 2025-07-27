import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function LogoutButton() {
  const { logout } = useContext(AuthContext);

  return <button onClick={logout}>Logout</button>;
}
