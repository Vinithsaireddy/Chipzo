'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in query results by default
    },
  },
  {
    timestamps: true,
  }
);

// ─── Pre-save hook: hash password when modified ───────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if password field is actually modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance method: password comparison ─────────────────────────────────────
/**
 * Compares a plain-text candidate password against the stored hash.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
