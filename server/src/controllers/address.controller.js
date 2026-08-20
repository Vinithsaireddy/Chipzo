'use strict';

const addressService = require('../services/address.service');
const geocodingService = require('../services/geocoding.service');
const olaMapsService = require('../services/olaMaps.service');
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

const searchLocations = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return new ApiResponse(200, 'Query too short', { predictions: [] }).send(res);
  }
  const predictions = await olaMapsService.searchLocations(q);
  return new ApiResponse(200, 'Search results fetched', { predictions }).send(res);
});

const getMapsToken = asyncHandler(async (req, res) => {
  const token = await olaMapsService.getAccessToken();
  const style = process.env.OLA_MAPS_STYLE || 'eclipse-light-standard';
  return new ApiResponse(200, 'Maps token fetched', { token, style }).send(res);
});

const detectLocation = asyncHandler(async (req, res) => {
  try {
    const ipRes = await fetch('https://ipapi.co/json/', {
      headers: { 'User-Agent': 'ChipzoApp/1.0' },
    });
    if (!ipRes.ok) throw new Error('IP geolocation failed');
    const ipData = await ipRes.json();
    if (ipData.latitude && ipData.longitude) {
      return new ApiResponse(200, 'Location detected via IP', {
        lat: ipData.latitude,
        lng: ipData.longitude,
        city: ipData.city || 'Bengaluru',
        region: ipData.region || 'Karnataka',
        country: ipData.country_name || 'India',
      }).send(res);
    }
    throw new Error('No coordinates in IP response');
  } catch {
    return new ApiResponse(200, 'Fallback to default location', {
      lat: 12.9716,
      lng: 77.5946,
      city: 'Bengaluru',
      region: 'Karnataka',
      country: 'India',
    }).send(res);
  }
});

module.exports = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  reverseGeocode,
  searchLocations,
  getMapsToken,
  detectLocation,
};
