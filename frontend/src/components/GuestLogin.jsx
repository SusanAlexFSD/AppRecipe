import React, { useContext, useState } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function GuestLogin() {
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');

  const handleGuestLogin = async () => {
    try {
      const res = await axios.post('/users/guest');
      login(res.data.userId, res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Guest login failed');
    }
  };

  return (
    <div>
      <h2>Continue as Guest</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handleGuestLogin}>Login as Guest</button>
    </div>
  );
}
