'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) {
    throw new ApiError(400, 'Latitude and Longitude are required');
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Chipzo-App/1.0 (support@shopchipzo.com)'
      }
    });

    if (!response.ok) {
      throw new ApiError(response.status, `Geocoding service returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.address) {
      throw new ApiError(404, 'Could not resolve location address');
    }

    const addr = data.address;
    
    // Normalizing local Indian city boundaries
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    
    // Combining street names
    const streetComponents = [
      addr.road,
      addr.suburb,
      addr.neighbourhood,
      addr.residential
    ].filter(Boolean);
    
    let street = streetComponents.join(', ');
    if (!street && data.display_name) {
      street = data.display_name.split(',').slice(0, 2).map(s => s.trim()).join(', ');
    }

    const state = addr.state || 'Karnataka';
    // Remove space inside pincode if present (e.g. "560 103" -> "560103")
    const pincode = addr.postcode ? addr.postcode.replace(/\s+/g, '') : '';

    return {
      street: street || 'Unknown Street',
      city: city || 'Bengaluru',
      state: state,
      pincode: pincode
    };

  } catch (error) {
    logger.error('[Geocoding Service] Failed reverse geocode lookup:', error);
    throw new ApiError(error.status || 500, error.message || 'Geocoding request failed');
  }
};

module.exports = {
  reverseGeocode
};
