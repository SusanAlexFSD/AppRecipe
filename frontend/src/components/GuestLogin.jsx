import React, { useContext, useState } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import "./GuestLogin.css";

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
  <div className="guest-container">
    <div className="guest-card">
      <h2>Continue as Guest</h2>

      {error && <p className="guest-error">{error}</p>}
      {success && <p className="guest-success">{success}</p>}

      <button className="guest-btn" onClick={handleGuestLogin}>
        Login as Guest
      </button>
    </div>
  </div>
);

}
