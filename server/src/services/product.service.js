'use strict';

const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

/**
 * Builds a MongoDB query from filter params and executes a paginated product search.
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
  const limitNum = Math.min(parseInt(limit, 10), 100); // Cap at 100 items per page
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  // Full-text search
  if (search) {
    filter.$text = { $search: search };
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
  }

  // In-stock filter
  if (inStock === 'true') {
    filter.stock = { $gt: 0 };
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
 * Fetches a single product by ID. Throws 404 if not found.
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
 * Creates a new product document.
 * @param {object} productData
 */
const createProduct = async (productData) => {
  const product = await Product.create(productData);
  return product;
};

/**
 * Partially updates a product. Throws 404 if not found.
 * @param {string}  productId
 * @param {object}  updates
 */
const updateProduct = async (productId, updates) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
};

/**
 * Deletes a product by ID.
 * Soft-awareness: refuses deletion if product exists in active orders.
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
  createProduct,
  updateProduct,
  deleteProduct,
};
