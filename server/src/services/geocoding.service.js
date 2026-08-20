'use strict';

const olaMapsService = require('./olaMaps.service');
const ApiError = require('../utils/ApiError');

const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) {
    throw new ApiError(400, 'Latitude and Longitude are required');
  }

  try {
    const result = await olaMapsService.reverseGeocode(
      parseFloat(lat),
      parseFloat(lng)
    );
    return {
      street: result.street,
      city: result.city,
      state: result.state,
      pincode: result.pincode,
    };
  } catch (error) {
    throw new ApiError(
      error.status || 500,
      error.message || 'Geocoding request failed'
    );
  }
};

module.exports = {
  reverseGeocode,
};
