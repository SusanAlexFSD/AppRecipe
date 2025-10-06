// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const recipeRoutes = require('./routes/recipes');
const userRoutes = require('./routes/users');
const shoppingListRoutes = require('./routes/shoppingList');
const favoritesRoutes = require('./routes/favorites');
const auth = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Test route
app.get('/', (req, res) => res.send('API is running'));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/shoppingList', shoppingListRoutes);
app.use('/api/favorites', favoritesRoutes);

// Protected route
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'You have access!', user: req.user });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
