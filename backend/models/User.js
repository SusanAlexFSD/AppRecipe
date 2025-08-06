const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  isGuest: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);