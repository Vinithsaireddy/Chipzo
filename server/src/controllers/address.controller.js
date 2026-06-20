'use strict';

const addressService = require('../services/address.service');
const geocodingService = require('../services/geocoding.service');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getAddresses(req.user._id);
  return new ApiResponse(200, 'Addresses fetched successfully', { addresses }).send(res);
});

const getAddress = asyncHandler(async (req, res) => {
  const address = await addressService.getAddressById(req.params.id, req.user._id);
  return new ApiResponse(200, 'Address fetched successfully', { address }).send(res);
});

const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.user._id, req.body);
  return new ApiResponse(201, 'Address created successfully', { address }).send(res);
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(req.params.id, req.user._id, req.body);
  return new ApiResponse(200, 'Address updated successfully', { address }).send(res);
});

const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.params.id, req.user._id);
  return new ApiResponse(200, 'Address deleted successfully', null).send(res);
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await addressService.setDefaultAddress(req.params.id, req.user._id);
  return new ApiResponse(200, 'Default address updated', { address }).send(res);
});

const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  const address = await geocodingService.reverseGeocode(lat, lng);
  return new ApiResponse(200, 'Location reverse-geocoded successfully', { address }).send(res);
});

module.exports = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  reverseGeocode,
};
