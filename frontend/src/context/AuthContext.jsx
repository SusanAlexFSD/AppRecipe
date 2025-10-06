import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

/**
 * AuthProvider:
 * - manages user and token in state + localStorage
 * - exposes login/logout
 * - exposes axiosInstance (baseURL '/api') and keeps its Authorization header in sync with token
 */
export function AuthProvider({ children }) {
  // safe lazy init for user
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.error('Failed to parse user from localStorage:', err);
      localStorage.removeItem('user');
      return null;
    }
  });

  // token is stored as string
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token');
    } catch (err) {
      return null;
    }
  });

  // Create a memoized axios instance with baseURL '/api'
  const axiosInstance = useMemo(() => {
    const inst = axios.create({
      baseURL: '/api', // all endpoint calls will be relative to /api
      timeout: 15000,
    });
    return inst;
  }, []);

  // keep axios Authorization header in sync with token
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try { localStorage.setItem('token', token); } catch (e) {}
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
      try { localStorage.removeItem('token'); } catch (e) {}
    }
  }, [token, axiosInstance]);

  // persist user to localStorage
  useEffect(() => {
    try {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
    } catch (err) {
      console.error('Failed to persist user to localStorage:', err);
    }
  }, [user]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    try {
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      console.warn('LocalStorage unavailable:', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (err) {}
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, axiosInstance }}>
      {children}
    </AuthContext.Provider>
  );
}

// convenience hook
export function useAuth() {
  return useContext(AuthContext);
}