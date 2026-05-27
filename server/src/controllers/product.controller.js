'use strict';

const productService = require('../services/product.service');
const cloudflareService = require('../services/cloudflare.service');
const env = require('../config/env');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const publicImageBase = (() => {
  try {
    return new URL(env.CLOUDFLARE_PUBLIC_URL);
  } catch (error) {
    return null;
  }
})();

const rewriteImageUrl = (imageUrl) => {
  if (!imageUrl || !publicImageBase) {
    return imageUrl;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    if (parsedUrl.origin !== publicImageBase.origin) {
      return imageUrl;
    }

    const basePath = publicImageBase.pathname.replace(/\/+$/, '');
    const imagePath = parsedUrl.pathname;
    const relativePath = basePath && imagePath.startsWith(basePath)
      ? imagePath.slice(basePath.length)
      : imagePath;
    const key = relativePath.replace(/^\/+/, '');

    return key ? `/api/products/images/${key}` : imageUrl;
  } catch (error) {
    return imageUrl;
  }
};

const serializeProduct = (product) => {
  if (!product) {
    return product;
  }

  return {
    ...product,
    images: Array.isArray(product.images) ? product.images.map(rewriteImageUrl) : [],
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
  if (productData.stock !== undefined) {
    productData.stock = parseInt(productData.stock, 10);
  }
  if (productData.in_stock !== undefined) {
    productData.in_stock = productData.in_stock === 'true' || productData.in_stock === true;
  }
  // specifications / interfaces may arrive as JSON strings from multipart
  if (typeof productData.specifications === 'string') {
    productData.specifications = JSON.parse(productData.specifications);
  }
  if (typeof productData.interfaces === 'string') {
    productData.interfaces = JSON.parse(productData.interfaces);
  }

  // Upload any attached images to Cloudflare R2
  const uploadedUrls = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const { url } = await cloudflareService.uploadImage(file);
      uploadedUrls.push(url);
    }
  }

  if (uploadedUrls.length > 0) {
    productData.images = [...(productData.images || []), ...uploadedUrls];
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
  if (updates.stock !== undefined) {
    updates.stock = parseInt(updates.stock, 10);
  }
  if (updates.in_stock !== undefined) {
    updates.in_stock = updates.in_stock === 'true' || updates.in_stock === true;
  }
  if (typeof updates.specifications === 'string') {
    updates.specifications = JSON.parse(updates.specifications);
  }
  if (typeof updates.interfaces === 'string') {
    updates.interfaces = JSON.parse(updates.interfaces);
  }

  // Upload new images (if any) and replace the existing images array.
  if (req.files && req.files.length > 0) {
    const newUrls = [];
    for (const file of req.files) {
      const { url } = await cloudflareService.uploadImage(file);
      newUrls.push(url);
    }
    updates._replaceImages = newUrls;
    // Remove images from body to avoid double-setting
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

  const image = await cloudflareService.getImage(key);
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

  // Best-effort: delete all images from R2 after DB deletion
  if (product.images && product.images.length > 0) {
    // Fire-and-forget — don't block response on image cleanup
    Promise.allSettled(
      product.images.map((url) => {
        const key = url.split('/').pop(); // derive key from URL path
        return cloudflareService.deleteImage(key);
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
