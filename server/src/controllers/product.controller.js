'use strict';

const productService = require('../services/product.service');
const cloudflareService = require('../services/cloudflare.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getFileName } = require('../utils/imageHelper');

const serializeProduct = (product) => {
  if (!product) {
    return product;
  }

  return {
    ...product,
    images: Array.isArray(product.images) ? product.images : [],
  };
};

/**
 * GET /api/products
 * Returns paginated, filtered product list.
 */
const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getPaginatedProducts(req.query);

  return new ApiResponse(200, 'Products fetched successfully', result.products.map(serializeProduct), {
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    totalCount: result.totalCount,
    limit: result.limit,
  }).send(res);
});

/**
 * GET /api/products/:id
 * Returns a single product by MongoDB _id.
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  return new ApiResponse(200, 'Product fetched successfully', { product: serializeProduct(product) }).send(res);
});

/**
 * GET /api/products/slug/:slug
 * Returns a single product by its inventory slug (id field).
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  return new ApiResponse(200, 'Product fetched successfully', { product: serializeProduct(product) }).send(res);
});

/**
 * POST /api/products
 * Creates a new product. Image upload is optional.
 * If files are supplied they are uploaded to Cloudflare R2 and appended to images[].
 */
const createProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body };

  // Coerce numeric / boolean fields that arrive as multipart strings
  if (productData.price !== undefined && productData.price !== null) {
    productData.price = parseFloat(productData.price);
  }
  // specifications / interfaces may arrive as JSON strings from multipart
  if (typeof productData.specifications === 'string') {
    productData.specifications = JSON.parse(productData.specifications);
  }
  if (typeof productData.interfaces === 'string') {
    productData.interfaces = JSON.parse(productData.interfaces);
  }

  const uploadedFiles = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const { fileName } = await cloudflareService.uploadImage(file);
      uploadedFiles.push(fileName);
    }
  }

  if (uploadedFiles.length > 0) {
    productData.images = [...(productData.images || []), ...uploadedFiles];
  }

  const product = await productService.createProduct(productData);
  return new ApiResponse(201, 'Product created successfully', { product: serializeProduct(product.toObject ? product.toObject() : product) }).send(res);
});

/**
 * PUT /api/products/:id
 * Partially updates a product. Optionally uploads new images to R2 (appended).
 */
const updateProduct = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  console.log('[UPDATE_PRODUCT] Incoming body keys:', Object.keys(req.body));
  console.log('[UPDATE_PRODUCT] images field:', req.body.images);
  console.log('[UPDATE_PRODUCT] req.files:', req.files?.length, 'files');

  // Coerce multipart strings
  if (updates.price !== undefined && updates.price !== null) {
    updates.price = parseFloat(updates.price);
  }
  if (typeof updates.specifications === 'string') {
    updates.specifications = JSON.parse(updates.specifications);
  }
  if (typeof updates.interfaces === 'string') {
    updates.interfaces = JSON.parse(updates.interfaces);
  }

  if (req.files && req.files.length > 0) {
    const newFiles = [];
    for (const file of req.files) {
      const { fileName } = await cloudflareService.uploadImage(file);
      newFiles.push(fileName);
    }
    updates._replaceImages = newFiles;
    delete updates.images;
  }

  const product = await productService.updateProduct(req.params.id, updates);
  return new ApiResponse(200, 'Product updated successfully', { product: serializeProduct(product.toObject ? product.toObject() : product) }).send(res);
});

/**
 * PATCH /api/products/:id/images
 * Adds one or more image URLs to the product's images array.
 * Body: { images: ["url1", "url2"] }
 */
const addImages = asyncHandler(async (req, res) => {
  const { images } = req.body;
  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new ApiError(400, 'images must be a non-empty array of URLs');
  }

  const product = await productService.addImages(req.params.id, images);
  return new ApiResponse(200, 'Images added successfully', { product: serializeProduct(product.toObject ? product.toObject() : product) }).send(res);
});

/**
 * DELETE /api/products/:id/images
 * Removes a specific image URL from the images array.
 * Body: { url: "https://..." }
 */
const removeImage = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) {
    throw new ApiError(400, 'Image URL is required');
  }

  const product = await productService.removeImage(req.params.id, url);
  return new ApiResponse(200, 'Image removed successfully', { product: serializeProduct(product.toObject ? product.toObject() : product) }).send(res);
});

const getProductImage = asyncHandler(async (req, res) => {
  const key = req.params[0];
  if (!key) {
    throw new ApiError(400, 'Image key is required');
  }

  const fileName = getFileName(key);
  const image = await cloudflareService.getImage(fileName);
  if (image.contentType) {
    res.setHeader('Content-Type', image.contentType);
  }
  if (image.contentLength) {
    res.setHeader('Content-Length', image.contentLength);
  }
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  image.body.pipe(res);
});

/**
 * DELETE /api/products/:id
 * Deletes a product (checks for active orders first).
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await productService.deleteProduct(req.params.id);

  if (product.images && product.images.length > 0) {
    Promise.allSettled(
      product.images.map((img) => {
        const fileName = img.startsWith('http') ? img.split('/').pop() : img;
        return cloudflareService.deleteImage(fileName);
      })
    );
  }

  return new ApiResponse(200, 'Product deleted successfully', null).send(res);
});

module.exports = {
  getProducts,
  getProduct,
  getProductBySlug,
  getProductImage,
  createProduct,
  updateProduct,
  addImages,
  removeImage,
  deleteProduct,
};
