import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X, Loader2 } from 'lucide-react';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export function LocationSearch({
  placeholder,
  value,
  onSelect,
  className = '',
}) {
  const initialAddress = typeof value === 'string' ? value : value?.address || '';
  const [query, setQuery] = useState(initialAddress);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const timer = useRef(null);
  const abortControllerRef = useRef(null);
  const containerRef = useRef(null);
  const latestResultsRef = useRef([]);

  // Sync with value prop updates from parent
  useEffect(() => {
    const nextVal = typeof value === 'string' ? value : value?.address || '';
    setQuery(nextVal);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timer.current) clearTimeout(timer.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const formatLocationItem = (item) => ({
    address: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    shortName:
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.address?.suburb ||
      item.address?.county ||
      item.display_name.split(',')[0],
  });

  const fetchNominatim = async (q) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(
        `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=6&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: abortControllerRef.current.signal,
        }
      );

      if (!res.ok) throw new Error('Search failed');

      const data = await res.json();
      latestResultsRef.current = data;
      setResults(data);
      setOpen(true);
      return data;
    } catch (err) {
      if (err.name !== 'AbortError') {
        latestResultsRef.current = [];
        setResults([]);
        setOpen(true);
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const q = e.target.value;
    setQuery(q);

    if (timer.current) clearTimeout(timer.current);

    if (q.trim().length < 3) {
      setResults([]);
      setOpen(false);
      onSelect?.(null);
      return;
    }

    setLoading(true);
    timer.current = setTimeout(() => {
      fetchNominatim(q);
    }, 400);
  };

  const select = (item) => {
    const selected = formatLocationItem(item);
    setQuery(selected.address);
    setResults([]);
    setOpen(false);
    onSelect?.(selected);
  };

  // Auto-select the top match if the user hits Enter or clicks away without picking from the list
  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        select(results[0]);
      } else if (query.trim().length >= 3) {
        setLoading(true);
        const fetched = await fetchNominatim(query);
        if (fetched && fetched.length > 0) {
          select(fetched[0]);
        }
      }
    }
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    if (timer.current) clearTimeout(timer.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    onSelect?.(null);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder={placeholder || 'Search location...'}
          className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />

        {loading ? (
          <Loader2
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
          />
        ) : query ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-64 overflow-y-auto">
          {loading && results.length === 0 && (
            <div className="p-3 text-sm text-gray-500 text-center">
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-gray-500 text-center">
              No results found
            </div>
          )}

          {results.map((item) => (
            <button
              type="button"
              key={item.place_id}
              onClick={() => select(item)}
              className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0 transition-colors"
            >
              <MapPin
                size={14}
                className="text-emerald-600 mt-1 flex-shrink-0"
              />
              <span className="text-sm text-gray-700 line-clamp-2">
                {item.display_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export async function fetchRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) return null;

  const validWaypoints = waypoints.filter(
    (p) => p && typeof p.lat === 'number' && typeof p.lng === 'number'
  );
  if (validWaypoints.length < 2) return null;

  const coords = validWaypoints.map((p) => `${p.lng},${p.lat}`).join(';');

  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];

    return {
      coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance_km: (route.distance / 1000).toFixed(2),
      duration_min: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}