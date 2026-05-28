'use strict';

const env = require('../config/env');

const PRODUCT_PREFIX = 'products/';

const getImageKey = (fileName) => {
  if (!fileName) return '';
  if (fileName.startsWith(PRODUCT_PREFIX)) return fileName;
  return `${PRODUCT_PREFIX}${fileName}`;
};

const getFileName = (key) => {
  if (!key) return '';
  if (key.startsWith(PRODUCT_PREFIX)) {
    return key.slice(PRODUCT_PREFIX.length);
  }
  if (key.includes('/')) {
    return key.split('/').pop();
  }
  return key;
};

const getFullImageUrl = (fileName) => {
  if (!fileName) return '';
  if (fileName.startsWith('http')) return fileName;
  const base = env.CLOUDFLARE_PUBLIC_URL.replace(/\/+$/, '');
  return `${base}/${fileName}`;
};

module.exports = { getImageKey, getFileName, getFullImageUrl, PRODUCT_PREFIX };
