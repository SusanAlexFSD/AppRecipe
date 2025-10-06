const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Recipe = require('../models/Recipe');

dotenv.config(); // Load DB config from .env

async function cleanInvalidRecipes() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const result = await Recipe.deleteMany({
      $or: [
        { title: { $exists: false } },
        { image: { $exists: false } },
        { title: '' },
        { image: '' },
      ]
    });

    console.log(`🧹 Deleted ${result.deletedCount} incomplete recipe(s).`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error cleaning recipes:', err.message);
    process.exit(1);
  }
}

cleanInvalidRecipes();