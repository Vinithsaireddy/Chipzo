'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Signs and returns a JWT for the given user.
 *
 * Supports two call styles:
 *   generateToken(userDocument)  — embeds { id, role } in payload
 *   generateToken(userId)        — embeds { id } only (legacy / backward-compat)
 *
 * @param {object|string|import('mongoose').Types.ObjectId} userOrId
 * @returns {string} Signed JWT string
 */
const generateToken = (userOrId) => {
  // If a full user document was passed (has ._id), embed role too
  const isUserDoc = userOrId && typeof userOrId === 'object' && userOrId._id;

  const payload = isUserDoc
    ? { id: userOrId._id.toString(), role: userOrId.role || 'user' }
    : { id: userOrId.toString() };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

module.exports = generateToken;
