import React, { useContext, useState } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function GuestLogin() {
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleGuestLogin = async () => {
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('/users/guest');
      login(res.data.user, res.data.token);

      setSuccess('Logged in as Guest!');

      setTimeout(() => {
        navigate('/');
      }, 1200);

    } catch (err) {
      setError(err.response?.data?.message || 'Guest login failed');
    }
  };

  return (
    <div>
      <h2>Continue as Guest</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <button onClick={handleGuestLogin}>Login as Guest</button>
    </div>
  );
}
