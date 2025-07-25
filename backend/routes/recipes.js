const express = require('express');
const router = express.Router();
const axios = require('axios');

// Test route: fetch recipes from TheMealDB
router.get('/test', async (req, res) => {
  try {
    const response = await axios.get('https://www.themealdb.com/api/json/v1/1/search.php?s=');
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch from TheMealDB' });
  }
});

module.exports = router;
