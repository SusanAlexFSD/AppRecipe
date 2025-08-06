const mongoose = require('mongoose');

const categoryCacheSchema = new mongoose.Schema({
  category: { type: String, required: true },
  data: [
    {
      apiId: String,
      title: String,
      image: String,
      category: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CategoryCache', categoryCacheSchema);