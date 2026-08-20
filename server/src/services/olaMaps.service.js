'use strict';

const logger = require('../utils/logger');

const OLA_BASE = 'https://api.olamaps.io';
const BANGALORE_VIEWBOX = '77.35,13.20,77.85,12.75';

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 120_000) {
    return cachedToken;
  }

  const clientId = process.env.OLA_MAPS_CLIENT_ID;
  const clientSecret = process.env.OLA_MAPS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('OLA_MAPS_CLIENT_ID and OLA_MAPS_CLIENT_SECRET must be set');
  }

  const res = await fetch(`${OLA_BASE}/auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
  });

  if (!res.ok) {
    throw new Error(`Ola Maps auth failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Ola Maps auth failed: no access_token');
  }

  cachedToken = data.access_token;

  let expiresInSeconds = data.expires_in || 3600;
  try {
    const payload = JSON.parse(Buffer.from(data.access_token.split('.')[1], 'base64url').toString());
    if (payload.exp) {
      expiresInSeconds = payload.exp - Math.floor(now / 1000);
    }
  } catch {}

  tokenExpiresAt = now + expiresInSeconds * 1000;
  logger.info(`[OlaMaps] OAuth token refreshed, expires in ${Math.round(expiresInSeconds / 60)}min`);
  return cachedToken;
}

async function olaFetch(path) {
  const token = await getAccessToken();
  const res = await fetch(`${OLA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Ola Maps API error: HTTP ${res.status}`);
  }
  return res.json();
}

async function searchLocations(query) {
  if (!query || query.length < 2) return [];

  const encoded = encodeURIComponent(query);
  const path = `/places/v1/autocomplete?input=${encoded}&location=12.9716,77.5946&radius=50000`;

  try {
    const data = await olaFetch(path);
    if (data.status !== 'ok' || !data.predictions) return [];

    return data.predictions.map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
      lat: p.geometry?.location?.lat || null,
      lng: p.geometry?.location?.lng || null,
    }));
  } catch (err) {
    logger.error('[OlaMaps] Search failed:', err.message);
    return [];
  }
}

async function reverseGeocode(lat, lng) {
  if (!lat || !lng) {
    throw new Error('Latitude and Longitude are required');
  }

  try {
    const path = `/places/v1/reverse-geocode?latlng=${lat},${lng}`;
    const data = await olaFetch(path);

    if (data.status !== 'ok' || !data.results?.length) {
      throw new Error('Could not resolve location address');
    }

    const result = data.results[0];
    const components = {};
    if (result.address_components) {
      for (const comp of result.address_components) {
        for (const type of comp.types) {
          components[type] = comp;
        }
      }
    }

    const streetParts = [
      components.street_number?.long_name,
      components.route?.long_name,
      components.sublocality_level_1?.long_name || components.sublocality?.long_name,
      components.neighborhood?.long_name,
    ].filter(Boolean);

    let street = streetParts.join(', ');
    if (!street) {
      street = result.formatted_address?.split(',')[0] || 'Unknown Street';
    }

    const city =
      components.locality?.long_name ||
      components.administrative_area_level_3?.long_name ||
      components.administrative_area_level_2?.long_name ||
      'Bengaluru';

    const state =
      components.administrative_area_level_1?.long_name || 'Karnataka';

    const pincode =
      components.postal_code?.long_name?.replace(/\s+/g, '') || '';

    logger.info(
      `[OlaMaps] Reverse geocode: lat=${lat}, lng=${lng} => street="${street}", city="${city}", state="${state}", pincode="${pincode}"`
    );

    return {
      street: street || 'Unknown Street',
      city,
      state,
      pincode,
      formattedAddress: result.formatted_address || '',
    };
  } catch (err) {
    logger.error('[OlaMaps] Reverse geocode failed:', err.message);
    throw err;
  }
}

async function forwardGeocode(address) {
  if (!address) throw new Error('Address is required');

  try {
    const encoded = encodeURIComponent(address);
    const path = `/places/v1/geocode?address=${encoded}`;
    const data = await olaFetch(path);

    if (data.status !== 'ok' || !data.geocodingResults?.length) {
      throw new Error('Could not geocode address');
    }

    const result = data.geocodingResults[0];
    return {
      lat: result.geometry?.location?.lat,
      lng: result.geometry?.location?.lng,
      formattedAddress: result.formatted_address || '',
    };
  } catch (err) {
    logger.error('[OlaMaps] Forward geocode failed:', err.message);
    throw err;
  }
}

module.exports = {
  getAccessToken,
  searchLocations,
  reverseGeocode,
  forwardGeocode,
};
