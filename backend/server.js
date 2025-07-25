require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const recipeRoutes = require('./routes/recipes');
//const userRoutes = require('./routes/users'); // if you’ve created this already

// Use routes
app.use('/api/recipes', recipeRoutes);
//app.use('/api/users', userRoutes); // optional if you haven’t built it yet

// Test root route
app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
