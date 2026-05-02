'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Signs and returns a JWT for the given user ID.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {string} Signed JWT string
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId.toString() }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

module.exports = generateToken;
