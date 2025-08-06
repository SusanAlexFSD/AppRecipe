require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Add request logging middleware FIRST
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Test routes FIRST (before other routes)
app.get('/', (req, res) => {
  console.log('🏠 Root route hit');
  res.send('API is running');
});

app.get('/test', (req, res) => {
  console.log('🧪 Test route hit!');
  res.json({ message: 'Console logging works!', timestamp: new Date().toISOString() });
});

// Import and use routes
const userRoutes = require('./routes/users');
const recipeRoutes = require('./routes/recipes');
const auth = require('./middleware/auth');

console.log('✅ Routes imported successfully');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);

console.log('✅ Routes mounted successfully');

// Authentication routes
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'You have access!', user: req.user });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
console.log('🔄 Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 API available at http://localhost:${PORT}`);
      console.log('🚀 Ready to receive requests!');
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions  
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});