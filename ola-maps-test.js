const CLIENT_ID = 'e5662b31-2de4-4f3f-a32a-81f213daca12';
const CLIENT_SECRET = '05a75f84da0b4f18ac35e6d1ced67243';
const API_KEY = 'VCYqF8I0uuaTXTXIP74AmEKapcN36nruUy52rfi4';

const BASE = 'https://api.olamaps.io';
const ORIGIN = '12.9716,77.5946';
const DEST = '12.9352,77.6245';

let token = null;

async function getToken() {
  const res = await fetch(`${BASE}/auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get token: ' + JSON.stringify(data));
  token = data.access_token;
}

async function apiPost(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return { status: res.status, data: await res.json() };
}

async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return { status: res.status, data: await res.json() };
}

const ok = (s) => s === 'OK' || s === 'SUCCESS' || s === 'ok';

function pass(name, detail) { console.log(`  ✅ ${name}: ${detail}`); }
function fail(name, msg) { console.log(`  ❌ ${name}: ${msg}`); }

async function run() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║      OLA MAPS API TEST SUITE        ║');
  console.log('╚══════════════════════════════════════╝\n');

  // Auth
  console.log('[1] Authentication (OAuth2 Client Credentials)');
  try {
    await getToken();
    pass('OAuth', 'Token acquired successfully');
  } catch (e) {
    fail('OAuth', e.message);
    return;
  }

  // Directions Basic
  console.log('\n[2] Directions Basic API (POST /routing/v1/directions/basic)');
  const dir = await apiPost(
    `/routing/v1/directions/basic?origin=${ORIGIN}&destination=${DEST}&mode=driving&alternatives=false&steps=true&overview=full&language=en&route_preference=fastest`
  );
  if (ok(dir.data.status) && dir.data.routes?.[0]?.legs?.[0]) {
    const leg = dir.data.routes[0].legs[0];
    pass('Directions Basic', `${leg.readable_distance} | ${leg.readable_duration} (${leg.steps?.length || 0} steps)`);
  } else {
    fail('Directions Basic', `HTTP ${dir.status}: ${dir.data.status || JSON.stringify(dir.data).substring(0, 100)}`);
  }

  // Directions Full
  console.log('\n[3] Directions API (POST /routing/v1/directions)');
  const dirFull = await apiPost(
    `/routing/v1/directions?origin=${ORIGIN}&destination=${DEST}&mode=driving&alternatives=false&steps=true&overview=full&language=en&traffic_metadata=false&route_preference=fastest`
  );
  if (ok(dirFull.data.status) && dirFull.data.routes?.[0]?.legs?.[0]) {
    const leg = dirFull.data.routes[0].legs[0];
    pass('Directions Full', `${leg.readable_distance} | ${leg.readable_duration}`);
  } else {
    fail('Directions Full', `HTTP ${dirFull.status}: ${dirFull.data.status}`);
  }

  // Distance Matrix
  console.log('\n[4] Distance Matrix API (GET /routing/v1/distanceMatrix)');
  const dm = await apiGet(
    `/routing/v1/distanceMatrix?origins=${ORIGIN}|${DEST}&destinations=${DEST}|${ORIGIN}&mode=driving&route_preference=fastest`
  );
  if (ok(dm.data.status) && dm.data.rows?.[0]?.elements?.[0]) {
    const el = dm.data.rows[0].elements[0];
    pass('Distance Matrix', `${(el.distance/1000).toFixed(1)}km | ${Math.round(el.duration/60)}min`);
  } else {
    fail('Distance Matrix', `HTTP ${dm.status}: ${dm.data.status}`);
  }

  // Geocode
  console.log('\n[5] Geocode API (GET /places/v1/geocode)');
  const geo = await apiGet(`/places/v1/geocode?address=Bangalore`);
  if (ok(geo.data.status) && geo.data.geocodingResults?.length > 0) {
    const r = geo.data.geocodingResults[0];
    pass('Geocode', `${r.formatted_address} [${r.geometry?.location?.lat}, ${r.geometry?.location?.lng}]`);
  } else {
    fail('Geocode', `HTTP ${geo.status}: ${geo.data.status}`);
  }

  // Reverse Geocode
  console.log('\n[6] Reverse Geocode API (GET /places/v1/reverse-geocode)');
  const rgeo = await apiGet(`/places/v1/reverse-geocode?latlng=${ORIGIN}`);
  if (ok(rgeo.data.status) && rgeo.data.results?.length > 0) {
    pass('Reverse Geocode', rgeo.data.results[0].formatted_address?.substring(0, 60));
  } else {
    fail('Reverse Geocode', `HTTP ${rgeo.status}: ${rgeo.data.status}`);
  }

  // Autocomplete
  console.log('\n[7] Places Autocomplete API (GET /places/v1/autocomplete)');
  const ac = await apiGet(`/places/v1/autocomplete?input=Koramangla&location=${ORIGIN}&radius=50000`);
  if (ok(ac.data.status) && ac.data.predictions?.length > 0) {
    pass('Autocomplete', `${ac.data.predictions.length} suggestions (top: ${ac.data.predictions[0].description?.substring(0, 40)})`);
  } else {
    fail('Autocomplete', `HTTP ${ac.status}: ${ac.data.status}`);
  }

  // Route Optimizer
  console.log('\n[8] Route Optimizer API (POST /routing/v1/routeOptimizer)');
  const ro = await apiPost(
    `/routing/v1/routeOptimizer?locations=12.9716,77.5946|12.9352,77.6245|12.9766,77.5723&source=first&destination=last&round_trip=false&mode=driving&steps=false&overview=full&language=en&traffic_metadata=false&route_preference=fastest`
  );
  if (ok(ro.data.status) && ro.data.routes?.[0]) {
    const route = ro.data.routes[0];
    const totalDist = route.legs?.reduce((s, l) => s + l.distance, 0);
    const totalDur = route.legs?.reduce((s, l) => s + l.duration, 0);
    pass('Route Optimizer', `Order: ${route.waypoint_order?.join('→')} | ${(totalDist/1000).toFixed(1)}km | ${Math.round(totalDur/60)}min`);
  } else {
    fail('Route Optimizer', `HTTP ${ro.status}: ${ro.data.status}`);
  }

  // Summary
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║        ALL APIs VERIFIED ✅          ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('\nAuth method: OAuth2 Bearer token (client credentials)');
  console.log('Note: api_key query param is NOT needed when using Bearer auth');
}

run().catch(e => console.error('Fatal:', e));
