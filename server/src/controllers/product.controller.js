'use strict';

const productService = require('../services/product.service');
const cloudflareService = require('../services/cloudflare.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/products
 * Returns paginated, filtered product list.
 */
const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getPaginatedProducts(req.query);

  return new ApiResponse(200, 'Products fetched successfully', result.products, {
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    totalCount: result.totalCount,
    limit: result.limit,
  }).send(res);
});

/**
 * GET /api/products/:id
 * Returns a single product.
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return new ApiResponse(200, 'Product fetched successfully', { product }).send(res);
});

/**
 * POST /api/products
 * Creates a new product with image upload to Cloudflare R2.
 */
const createProduct = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Product image is required.');
  }

  const { url, key } = await cloudflareService.uploadImage(req.file);

  const product = await productService.createProduct({
    ...req.body,
    imageUrl: url,
    imageKey: key,
    price: parseFloat(req.body.price),
    stock: parseInt(req.body.stock, 10),
  });

  return new ApiResponse(201, 'Product created successfully', { product }).send(res);
});

/**
 * PUT /api/products/:id
 * Partially updates a product. Replaces image in R2 if a new file is uploaded.
 */
const updateProduct = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  // Handle price/stock coercion from multipart strings
  if (updates.price !== undefined) updates.price = parseFloat(updates.price);
  if (updates.stock !== undefined) updates.stock = parseInt(updates.stock, 10);

  if (req.file) {
    // Get existing product to delete old image
    const existingProduct = await productService.getProductById(req.params.id);

    if (existingProduct.imageKey) {
      await cloudflareService.deleteImage(existingProduct.imageKey);
    }

    const { url, key } = await cloudflareService.uploadImage(req.file);
    updates.imageUrl = url;
    updates.imageKey = key;
  }

  const product = await productService.updateProduct(req.params.id, updates);
  return new ApiResponse(200, 'Product updated successfully', { product }).send(res);
});

/**
 * DELETE /api/products/:id
 * Deletes a product (checks for active orders first).
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id);

  // Best-effort: delete image from R2 after DB deletion
  if (product.imageKey) {
    await cloudflareService.deleteImage(product.imageKey);
  }

  return new ApiResponse(200, 'Product deleted successfully', null).send(res);
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
