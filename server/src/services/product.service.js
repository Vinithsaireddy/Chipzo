'use strict';

const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

/**
 * Builds a MongoDB query from filter params and executes a paginated product search.
 *
 * Supported query params:
 *   page, limit, search, category, minPrice, maxPrice, inStock
 *
 * @param {object} queryParams - Express req.query
 * @returns {Promise<{ products, totalCount, totalPages, currentPage, limit }>}
 */
const getPaginatedProducts = async (queryParams) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
  } = queryParams;

  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.min(parseInt(limit, 10), 100);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  // Full-text search on name + description
  if (search) {
    filter.$text = { $search: search };
  }

  // Category filter (exact match)
  if (category) {
    filter.category = category;
  }

  // Price range — only applies to documents where price is not null
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = { $ne: null };
    if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
  }

  // in_stock filter
  if (inStock === 'true') {
    filter.in_stock = true;
  }

  const [products, totalCount] = await Promise.all([
    Product.find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    totalCount,
    totalPages: Math.ceil(totalCount / limitNum),
    currentPage: pageNum,
    limit: limitNum,
  };
};

/**
 * Fetches a single product by MongoDB _id. Throws 404 if not found.
 * @param {string} productId
 */
const getProductById = async (productId) => {
  const product = await Product.findById(productId).lean();
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

/**
 * Fetches a single product by its inventory slug (id field).
 * @param {string} slug
 */
const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ id: slug }).lean();
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

/**
 * Creates a new product document.
 * @param {object} productData
 */
const createProduct = async (productData) => {
  const product = await Product.create(productData);
  return product;
};

/**
 * Partially updates a product. Handles _prependImages from controller.
 * @param {string}  productId
 * @param {object}  updates
 */
const updateProduct = async (productId, updates) => {
  const { _prependImages, ...setFields } = updates;

  const mongoUpdate = {};

  if (Object.keys(setFields).length > 0) {
    mongoUpdate.$set = setFields;
  }

  if (_prependImages && _prependImages.length > 0) {
    mongoUpdate.$push = { images: { $each: _prependImages, $position: 0 } };
  }

  const product = await Product.findByIdAndUpdate(productId, mongoUpdate, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

/**
 * Appends image URLs to the product's images array.
 * @param {string}   productId
 * @param {string[]} urls
 */
const addImages = async (productId, urls) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $push: { images: { $each: urls } } },
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

/**
 * Removes a specific image URL from the images array.
 * @param {string} productId
 * @param {string} url
 */
const removeImage = async (productId, url) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $pull: { images: url } },
    { new: true }
  );
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

/**
 * Deletes a product by ID.
 * Refuses deletion if product exists in an active (paid, undelivered) order.
 * @param {string} productId
 */
const deleteProduct = async (productId) => {
  // Lazy import to avoid circular dependency
  const Order = require('../models/Order');

  const activeOrder = await Order.findOne({
    'items.productId': productId,
    paymentStatus: 'paid',
    deliveryStatus: { $nin: ['delivered'] },
  }).lean();

  if (activeOrder) {
    throw new ApiError(
      409,
      'Cannot delete product: it exists in an active order that has not been delivered yet.'
    );
  }

  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return product;
};

module.exports = {
  getPaginatedProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  addImages,
  removeImage,
  deleteProduct,
};
