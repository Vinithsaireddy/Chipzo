import { useState, useEffect, useRef, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { MapPin, Loader, Search, Crosshair, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { addressAPI } from '../services/api.js';

const BANGALORE_CENTER = [77.5946, 12.9716];

function SuggestionList({ items, searchLeft, searchTop, searchWidth, onSelect, onClose }) {
  const listRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (listRef.current && !listRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  if (!items.length) return null;

  return (
    <div
      ref={listRef}
      className="fixed z-[99999] bg-white border-[3px] border-[color:var(--chipzo-ink)] shadow-[4px_4px_0_rgba(0,0,0,1)] max-h-48 overflow-y-auto"
      style={{ left: searchLeft, top: searchTop, width: searchWidth }}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onMouseDown={() => { onSelect(item); onClose(); }}
          className="w-full text-left px-3 py-2.5 text-[10px] font-bold uppercase border-b-2 border-[color:var(--chipzo-rule)] hover:bg-[color:var(--chipzo-lime)]/30 transition-colors cursor-pointer last:border-b-0"
        >
          <span className="truncate block">{item.mainText || item.description}</span>
          {item.secondaryText && (
            <span className="block text-[9px] text-[color:var(--chipzo-muted)] normal-case truncate">{item.secondaryText}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function AddressMapPicker({ onLocationSelect, onDetecting }) {
  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const debounceRef = useRef(null);
  const searchRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const pendingCenterRef = useRef(null);
  const loadingTimerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0, width: 0 });

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
        if (!mapReady) setMapReady(true);
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
        updateMarker(map, [lng, lat]);
        reverseGeocodeAndNotify(lat, lng);
      });

      mapRef.current = map;
    } catch (err) {
      console.error('[OlaMaps] Failed to initialize map:', err);
      setMapError(err.message || 'Failed to load map');
    }
  }, [cleanupMap]);

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
        setPosition([pos.lat, pos.lng]);
        reverseGeocodeAndNotify(pos.lat, pos.lng);
      });
    }

    setPosition([lngLat[1], lngLat[0]]);
  }, []);

  const reverseGeocodeAndNotify = useCallback(async (lat, lng) => {
    try {
      const data = await addressAPI.reverseGeocode(lat, lng);
      const addr = data?.data?.address || data?.address;
      if (addr) {
        onLocationSelect({
          ...addr,
          lat,
          lng,
        });
        setSearchQuery(addr.street || '');
      }
    } catch {
      onLocationSelect({ street: '', city: '', state: 'Karnataka', pincode: '', lat, lng });
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (expanded && !mapRef.current) {
      const pending = pendingCenterRef.current;
      pendingCenterRef.current = null;
      initMap(pending?.center || null, pending?.zoom || 12);
    }
    return () => {
      cleanupMap();
    };
  }, [expanded, initMap, cleanupMap]);

  useEffect(() => {
    if (position && mapRef.current && mapReady) {
      mapRef.current.flyTo({ center: [position[1], position[0]], zoom: 15, duration: 1000 });
      updateMarker(mapRef.current, [position[1], position[0]]);
    }
  }, [position, mapReady, updateMarker]);

  const fetchSuggestions = useCallback(async (query) => {
    if (query.length < 2) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const data = await addressAPI.search(query);
      const preds = data?.data?.predictions || data?.predictions || [];
      setSuggestions(preds);
      if (preds.length) setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const updateDropdownPos = useCallback(() => {
    if (searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect();
      setDropdownPos({ left: rect.left, top: rect.bottom + 4, width: rect.width });
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateDropdownPos();
      fetchSuggestions(val);
    }, 300);
  };

  const selectSuggestion = async (item) => {
    setSearchQuery(item.mainText || '');
    setShowSuggestions(false);

    let lat = item.lat;
    let lng = item.lng;

    if (lat && lng) {
      setPosition([lat, lng]);
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
        updateMarker(mapRef.current, [lng, lat]);
      }
      reverseGeocodeAndNotify(lat, lng);
    }
  };

  const handleDetect = async () => {
    setLoading(true);
    if (onDetecting) onDetecting(true);

    const applyLocation = async (lat, lng) => {
      setPosition([lat, lng]);
      if (!mapRef.current) {
        pendingCenterRef.current = { center: [lng, lat], zoom: 15 };
        setExpanded(true);
      } else {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 });
        updateMarker(mapRef.current, [lng, lat]);
      }
      reverseGeocodeAndNotify(lat, lng);
    };

    const fallbackDetect = async () => {
      try {
        const data = await addressAPI.detectLocation();
        const loc = data?.data || data;
        await applyLocation(loc.lat, loc.lng);
      } catch {
        await applyLocation(12.9716, 77.5946);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await applyLocation(pos.coords.latitude, pos.coords.longitude);
          setLoading(false);
          if (onDetecting) onDetecting(false);
        },
        async () => {
          await fallbackDetect();
          setLoading(false);
          if (onDetecting) onDetecting(false);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      await fallbackDetect();
      setLoading(false);
      if (onDetecting) onDetecting(false);
    }
  };

  const handleRetry = () => {
    setMapError('');
    setMapReady(false);
    if (mapContainerRef.current) {
      initMap(null, 12);
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) setShowSuggestions(true);
    updateDropdownPos();
  };

  return (
    <div className="w-full md:col-span-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] hover:bg-[color:var(--chipzo-lime)] hover:-translate-y-[1px] hover:-translate-x-[1px] px-4 py-2.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[3px_3px_0_rgba(0,0,0,1)]"
      >
        <MapPin size={12} fill="currentColor" />
        {position ? 'Change Location on Map' : 'Pick on Map'}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="mt-3 border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-surface)]">
          <div className="flex gap-2 p-3 border-b-[3px] border-[color:var(--chipzo-ink)]">
            <div className="flex-1" ref={searchRef}>
              <div className="flex items-center border-[3px] border-[color:var(--chipzo-ink)] bg-white">
                <Search size={14} className="ml-3 text-[color:var(--chipzo-muted)] shrink-0" strokeWidth={3} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleFocus}
                  placeholder="Search area in Bangalore..."
                  className="w-full px-2 py-2 text-xs font-bold bg-transparent border-none outline-none uppercase"
                />
                {searching && <Loader size={12} className="mr-2 animate-spin text-[color:var(--chipzo-muted)]" />}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDetect}
              disabled={loading}
              className="border-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-primary)] px-4 py-2 text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loading ? <Loader size={12} className="animate-spin" /> : <Crosshair size={12} strokeWidth={3} />}
              DETECT
            </button>
          </div>

          {mapError && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border-b-[3px] border-[color:var(--chipzo-ink)]">
              <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-red-700">{mapError}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-2 text-[10px] font-black uppercase text-red-600 underline cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          <div
            ref={mapContainerRef}
            style={{ height: 240 }}
            className="w-full relative"
          >
            {!mapReady && !mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--chipzo-paper)] z-10">
                <div className="text-center px-4">
                  <Loader size={20} className="animate-spin mx-auto mb-2 text-[color:var(--chipzo-primary)]" />
                  <p className="text-[10px] font-bold text-[color:var(--chipzo-muted)] uppercase">
                    Loading Ola Maps...
                  </p>
                </div>
              </div>
            )}
          </div>

          {position && (
            <div className="p-3 border-t-[3px] border-[color:var(--chipzo-ink)] bg-[color:var(--chipzo-paper)]">
              <p className="text-[9px] font-bold text-[color:var(--chipzo-muted)] flex items-center gap-1">
                <MapPin size={10} />
                <span className="font-mono">{position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
                <span className="ml-auto text-[8px]">Drag pin or tap map to adjust</span>
              </p>
            </div>
          )}

          <SuggestionList
            items={showSuggestions ? suggestions : []}
            searchLeft={dropdownPos.left}
            searchTop={dropdownPos.top}
            searchWidth={dropdownPos.width}
            onSelect={selectSuggestion}
            onClose={() => setShowSuggestions(false)}
          />
        </div>
      )}
    </div>
  );
}
