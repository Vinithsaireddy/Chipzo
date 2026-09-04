import { useState, useEffect, useRef, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { MapPin, Loader, AlertTriangle, Search, Crosshair, Map } from 'lucide-react';
import { addressAPI } from '../services/api.js';

const BANGALORE_CENTER = [77.5946, 12.9716];

const BANGALORE_BOUNDS = {
  minLat: 12.73,
  maxLat: 13.17,
  minLng: 77.34,
  maxLng: 77.88,
};

const isInsideBangalore = (lat, lng) => {
  return (
    lat >= BANGALORE_BOUNDS.minLat &&
    lat <= BANGALORE_BOUNDS.maxLat &&
    lng >= BANGALORE_BOUNDS.minLng &&
    lng <= BANGALORE_BOUNDS.maxLng
  );
};

export default function LocationMap() {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const debounceRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const loadingTimerRef = useRef(null);

  const cleanupMap = useCallback(() => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
    setMapReady(false);
  }, []);

  const updateMarker = useCallback((map, lngLat) => {
    if (markerRef.current) {
      markerRef.current.setLngLat(lngLat);
    } else {
      const el = document.createElement('div');
      el.innerHTML = `<div style="
        width:28px;height:28px;
        background:var(--chipzo-primary,#f97316);
        border:3px solid var(--chipzo-ink,#1a1a1a);
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:2px 2px 0 rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
      "><div style="
        width:8px;height:8px;
        background:var(--chipzo-paper,#f5f5f0);
        border-radius:50%;
        transform:rotate(45deg);
      "></div></div>`;

      markerRef.current = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat(lngLat)
        .addTo(map);

      markerRef.current.on('dragend', () => {
        const pos = markerRef.current.getLngLat();
        if (!isInsideBangalore(pos.lat, pos.lng)) {
          setMapError('Delivery is only available within Bengaluru.');
          const prev = position; // position state stores [lat, lng]
          const prevLngLat = prev ? [prev[1], prev[0]] : BANGALORE_CENTER;
          markerRef.current.setLngLat(prevLngLat);
          return;
        }
        setMapError('');
        setPosition([pos.lat, pos.lng]);
        doReverseGeocode(pos.lat, pos.lng);
      });
    }
    setPosition([lngLat[1], lngLat[0]]);
  }, []);

  const doReverseGeocode = useCallback(async (lat, lng) => {
    try {
      const data = await addressAPI.reverseGeocode(lat, lng);
      const a = data?.data?.address || data?.address;
      if (a) {
        setAddress({
          street: a.street || '',
          city: a.city || '',
          state: a.state || '',
          pincode: a.pincode || '',
        });
      }
    } catch {
      setAddress(null);
    }
  }, []);

  const initMap = useCallback(async (center, zoom = 12) => {
    if (!mapContainerRef.current) return;
    cleanupMap();
    setMapError('');

    loadingTimerRef.current = setTimeout(() => {
      if (!mapRef.current) return;
      setMapError('Map took too long to load. Please try again.');
    }, 15000);

    try {
      const tokenData = await addressAPI.getMapsToken();
      const { token, style } = tokenData?.data || tokenData || {};
      if (!token) {
        setMapError('Could not get map credentials.');
        return;
      }

      const styleUrl = `https://api.olamaps.io/tiles/vector/v1/styles/${style || 'eclipse-light-standard'}/style.json`;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: center || BANGALORE_CENTER,
        zoom,
        maxBounds: [
          [BANGALORE_BOUNDS.minLng, BANGALORE_BOUNDS.minLat],
          [BANGALORE_BOUNDS.maxLng, BANGALORE_BOUNDS.maxLat]
        ],
        transformRequest: (url, resourceType) => {
          if (url.includes('olamaps.io')) {
            return { url, headers: { Authorization: `Bearer ${token}` } };
          }
          return { url };
        },
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      const markReady = () => {
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
        setMapReady(true);
      };

      map.on('load', markReady);
      map.on('style.load', markReady);

      map.on('error', (e) => {
        const err = e.error;
        const msg = err?.message || err?.statusText || e.message || '';
        console.error('[OlaMaps] Map error:', msg, err);
        if (msg.includes('style') || msg.includes('CORS') || msg.includes('Failed') || (err?.status && err.status >= 400 && !String(err.status).startsWith('404'))) {
          setMapError(`Map error: ${msg || 'Failed to load map'}`);
        }
      });

      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        if (!isInsideBangalore(lat, lng)) {
          setMapError('Delivery is only available within Bengaluru.');
          return;
        }
        setMapError('');
        updateMarker(map, [lng, lat]);
        doReverseGeocode(lat, lng);
      });

      mapRef.current = map;
    } catch (err) {
      console.error('[OlaMaps] Failed to initialize map:', err);
      setMapError(err.message || 'Failed to load map');
    }
  }, [cleanupMap, updateMarker, doReverseGeocode]);

  useEffect(() => {
    initMap();
    return () => {
      cleanupMap();
    };
  }, [initMap, cleanupMap]);

  const fetchSuggestions = useCallback(async (query) => {
    if (query.length < 2) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const data = await addressAPI.search(query);
      const preds = data?.data?.predictions || data?.predictions || [];
      setSuggestions(preds);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const selectSuggestion = async (item) => {
    setSearchQuery(item.mainText || item.description || '');
    setShowSuggestions(false);
    let lat = item.lat;
    let lng = item.lng;

    // If suggestion has no coordinates, fetch them via place details
    if ((!lat || !lng) && item.placeId) {
      try {
        const data = await addressAPI.getPlaceDetails(item.placeId);
        const loc = data?.data?.location || data?.location;
        if (loc) { lat = loc.lat; lng = loc.lng; }
      } catch { /* fall through */ }
    }

    if (lat && lng && mapRef.current) {
      if (!isInsideBangalore(lat, lng)) {
        setMapError('Selected location is outside Bengaluru. Delivery is not supported here.');
        return;
      }
      setMapError('');
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
      updateMarker(mapRef.current, [lng, lat]);
      doReverseGeocode(lat, lng);
    }
  };

  const detectLocation = () => {
    setLoading(true);
    setError('');

    const applyLocation = async (lat, lng) => {
      if (!isInsideBangalore(lat, lng)) {
        setMapError('Detected location is outside Bengaluru. Delivery is not supported here.');
        setLoading(false);
        return;
      }
      setMapError('');
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
        updateMarker(mapRef.current, [lng, lat]);
      } else {
        await initMap([lng, lat], 15);
      }
      doReverseGeocode(lat, lng);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await applyLocation(pos.coords.latitude, pos.coords.longitude);
          setLoading(false);
        },
        async () => {
          try {
            const data = await addressAPI.detectLocation();
            const loc = data?.data || data;
            await applyLocation(loc.lat, loc.lng);
          } catch {
            await applyLocation(12.9716, 77.5946);
          }
          setLoading(false);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      (async () => {
        try {
          const data = await addressAPI.detectLocation();
          const loc = data?.data || data;
          await applyLocation(loc.lat, loc.lng);
        } catch {
          await applyLocation(12.9716, 77.5946);
        }
        setLoading(false);
      })();
    }
  };

  const handleRetry = () => {
    setMapError('');
    setMapReady(false);
    initMap();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3 border-b-[3px] border-[color:var(--chipzo-ink)] pb-3">
        <MapPin size={24} strokeWidth={2.5} />
        <h2 className="text-2xl font-black uppercase tracking-tighter">Location Map</h2>
      </div>

      <div className="flex gap-3 relative">
        <div className="flex-1 relative">
          <div className="flex items-center brutal-border bg-[color:var(--chipzo-surface)]">
            <Search size={16} className="ml-4 text-[color:var(--chipzo-muted)] shrink-0" strokeWidth={3} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search for an area, landmark, or address in Bangalore..."
              className="w-full px-3 py-3 text-sm font-bold bg-transparent border-none outline-none uppercase"
            />
            {searching && <Loader size={14} className="mr-3 animate-spin text-[color:var(--chipzo-muted)]" />}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-[color:var(--chipzo-surface)] brutal-border shadow-[4px_4px_0_var(--chipzo-ink)] max-h-60 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onMouseDown={() => selectSuggestion(item)}
                  className="w-full text-left px-4 py-3 text-xs font-bold uppercase border-b-2 border-[color:var(--chipzo-rule)] hover:bg-[color:var(--chipzo-primary)]/20 transition-colors cursor-pointer last:border-b-0"
                >
                  <span className="block">{item.mainText || item.description}</span>
                  {item.secondaryText && (
                    <span className="block text-[10px] text-[color:var(--chipzo-muted)] normal-case">{item.secondaryText}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={detectLocation}
          disabled={loading}
          className="brutal-border bg-[color:var(--chipzo-primary)] px-4 py-3 font-black uppercase text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader size={14} className="animate-spin" /> : <Crosshair size={14} strokeWidth={3} />}
          DETECT
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-5 bg-red-50 brutal-border border-red-400">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-black uppercase text-sm">Location Error</h3>
            <p className="text-xs font-bold text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 p-6 bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow">
          <Loader size={20} className="animate-spin" />
          <span className="text-sm font-black uppercase">Detecting your location...</span>
        </div>
      )}

      {mapError && (
        <div className="flex items-start gap-3 p-5 bg-red-50 brutal-border border-red-400">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-black uppercase text-sm">Map Error</h3>
            <p className="text-xs font-bold text-red-700 mt-1">{mapError}</p>
            <button
              onClick={handleRetry}
              className="mt-2 text-xs font-black uppercase text-red-600 underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{ height: 400 }}
        className="brutal-border brutal-shadow w-full relative"
      >
        {!mapReady && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--chipzo-surface)] z-10">
            <div className="text-center">
              <Map size={48} className="text-[color:var(--chipzo-muted)] mx-auto mb-3" />
              <h2 className="text-lg font-black uppercase">Loading Ola Maps</h2>
              <p className="text-xs font-bold text-[color:var(--chipzo-muted)] mt-1">Powered by Krutrim</p>
            </div>
          </div>
        )}
      </div>

      {position && (
        <div className="bg-[color:var(--chipzo-surface)] brutal-border brutal-shadow p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest">Location Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">Coordinates</p>
              <p className="font-mono font-bold">{position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
            </div>
            {address && (
              <>
                {address.street && (
                  <div>
                    <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">Street / Area</p>
                    <p className="font-bold">{address.street}</p>
                  </div>
                )}
                {address.city && (
                  <div>
                    <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">City</p>
                    <p className="font-bold">{address.city}</p>
                  </div>
                )}
                {address.state && (
                  <div>
                    <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">State</p>
                    <p className="font-bold">{address.state}</p>
                  </div>
                )}
                {address.pincode && (
                  <div>
                    <p className="text-[9px] font-black uppercase text-[color:var(--chipzo-muted)]">Pincode</p>
                    <p className="font-bold">{address.pincode}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
