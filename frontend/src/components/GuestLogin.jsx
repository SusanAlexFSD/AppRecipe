import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Step 1: Import useNavigate
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function GuestLogin() {
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // ✅ Step 2: Initialize the hook

  const handleGuestLogin = async () => {
    try {
      const res = await axios.post('/users/guest');
      login(res.data.user, res.data.token);
      navigate('/'); // ✅ Step 3: Redirect to homepage
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
