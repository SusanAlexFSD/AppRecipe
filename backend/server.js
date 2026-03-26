require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 🧭 Debug: show server directory + resolved favorites route path
console.log('Server file dir:', __dirname);
console.log('Favorites route resolved to:', require.resolve('./routes/favorites'));

// 📦 Import routes
const favoritesRoutes = require('./routes/favorites');
const userRoutes = require('./routes/users');
const recipeRoutes = require('./routes/recipes');
const shoppingListRoutes = require('./routes/shoppingList');
const auth = require('./middleware/auth');

// 📝 Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  next();
});

// 🌐 Middleware
app.use(cors());
app.use(express.json());

// 🔧 Test routes
app.get('/', (req, res) => {
  console.log('🏠 Root route hit');
  res.send('API is running');
});

app.get('/test', (req, res) => {
  console.log('🧪 Test route hit!');
  res.json({
    message: 'Console logging works!',
    timestamp: new Date().toISOString()
  });
});

console.log('✅ Routes imported successfully');

// 🚏 Mount routes
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/shoppingList', shoppingListRoutes);
app.use('/api/favorites', favoritesRoutes);

console.log('✅ Routes mounted successfully');

// 🔐 Protected test route
app.get('/api/protected', auth, (req, res) => {
  res.json({ message: 'You have access!', user: req.user });
});

// ❌ Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 🌍 Port + environment
const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || 'development';

console.log('🔄 Connecting to MongoDB...');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');

    app.listen(PORT, () => {
      console.log(`✅ Server running in ${ENV} mode`);
      console.log(`✅ Listening on port ${PORT}`);

      if (ENV === 'development') {
        console.log(`🔗 API available at http://localhost:${PORT}`);
      } else {
        console.log('🔗 API available via deployed Render URL');
      }

      console.log('🚀 Ready to receive requests!');
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ⚠️ Global error listeners
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
