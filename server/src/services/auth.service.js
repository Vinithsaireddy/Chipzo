'use strict';

const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

/**
 * Hashes a plain-text password with bcrypt (12 rounds).
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => bcrypt.hash(password, 12);

/**
 * Compares a candidate password against a stored hash.
 * @param {string} candidatePassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
const comparePassword = async (candidatePassword, hashedPassword) =>
  bcrypt.compare(candidatePassword, hashedPassword);

/**
 * Signs and returns a JWT for the given user ID.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {string}
 */
const signToken = (userId) => generateToken(userId);

module.exports = { hashPassword, comparePassword, signToken };
