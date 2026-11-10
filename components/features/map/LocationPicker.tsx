'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Loader2, Search, X } from 'lucide-react';
import { searchPlaces, type PlaceResult } from '@/lib/utils/placeSearch';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FALLBACK_CENTER, getCurrentPosition } from '@/lib/utils/geo';

/**
 * Web port of `assets/components/Map/Map.js`.
 *
 * The RN screen rendered Leaflet + OpenStreetMap tiles inside a WebView by
 * building an HTML string. On the web we use the same Leaflet library directly,
 * which also removes the HTML-injection issue the string building had.
 *
 * Behaviour kept identical:
 *  - draggable blue marker for "my" position
 *  - tapping/clicking the map moves the marker
 *  - orange markers for nearby workers when a list is supplied
 *  - GPS fix on mount, falling back to Rawalpindi so the flow is never a dead end
 */

export interface WorkerPin {
  latitude: number | string;
  longitude: number | string;
  name?: string;
  role?: string;
}

export interface Coords {
  latitude: number;
  longitude: number;
}

/** Keeps the map on the current pin when a search result or geolocation moves it. */
function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() || 15, { animate: true });
  }, [center, map]);
  return null;
}

const userIcon = L.divIcon({
  html: '<div style="background:#1E64D3;width:18px;height:18px;border-radius:50%;border:3px solid #FFF;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: '',
});

const workerIcon = L.divIcon({
  html: '<div style="background:#FF6B35;width:16px;height:16px;border-radius:50%;border:2px solid #FFF;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
});

function ClickCapture({ onPick }: { onPick: (coords: Coords) => void }) {
  useMapEvents({
    click(event) {
      onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
    },
  });
  return null;
}

export default function LocationPicker({
  value,
  onChange,
  workers = [],
  height = 420,
  autoLocate = true,
}: {
  value: Coords | null;
  onChange: (coords: Coords) => void;
  workers?: WorkerPin[];
  height?: number | string;
  autoLocate?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (value) {
        setReady(true);
        return;
      }
      if (autoLocate) {
        const position = await getCurrentPosition();
        if (cancelled) return;
        if (position) {
          onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        } else {
          // No GPS fix or permission denied: show the map anyway so the user can
          // drop the pin manually - mandatory location must never be a dead end.
          onChange({ ...FALLBACK_CENTER });
        }
      } else {
        onChange({ ...FALLBACK_CENTER });
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Place search — port of the Photon box added to Map.js. Debounced by 350 ms and
     versioned so a stale response can never overwrite a newer query. */
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const searchVersion = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    const version = ++searchVersion.current;

    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError('');
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const found = await searchPlaces(trimmed, value ?? null);
      if (searchVersion.current !== version) return;
      setResults(found);
      setSearching(false);
      setSearchError(found.length === 0 ? 'No places matched that search.' : '');
    }, 350);

    return () => clearTimeout(timer);
  }, [query, value]);

  const pickPlace = (place: PlaceResult) => {
    onChange({ latitude: place.latitude, longitude: place.longitude });
    setQuery(place.label);
    setResults([]);
    setSearchError('');
  };

  const center = useMemo<[number, number]>(
    () => [value?.latitude ?? FALLBACK_CENTER.latitude, value?.longitude ?? FALLBACK_CENTER.longitude],
    // Only re-centre on first paint; dragging must not fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready],
  );

  if (!ready || !value) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-line bg-white text-sm font-medium text-subtle"
        style={{ height }}
      >
        Detecting your location…
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line" style={{ height }}>
      {/* Place search overlay */}
      <div className="absolute left-3 right-3 top-3 z-[500] sm:right-auto sm:w-80">
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 shadow-card">
          <Search size={15} className="shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a place or street"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            aria-label="Search for a place"
          />
          {searching && <Loader2 size={14} className="shrink-0 animate-spin text-brand" />}
          {!searching && query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setSearchError('');
              }}
              aria-label="Clear place search"
              className="shrink-0 rounded p-0.5 text-muted hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {(results.length > 0 || searchError) && (
          <div className="mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-line bg-white shadow-card">
            {results.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => pickPlace(place)}
                className="block w-full border-b border-line/60 px-3 py-2 text-left last:border-b-0 hover:bg-canvas"
              >
                <span className="block truncate text-sm font-semibold text-ink">{place.title}</span>
                {place.subtitle && <span className="block truncate text-[11px] text-subtle">{place.subtitle}</span>}
              </button>
            ))}
            {searchError && <p className="px-3 py-2 text-xs text-subtle">{searchError}</p>}
          </div>
        )}
      </div>

      <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <ClickCapture onPick={onChange} />

        <Marker
          position={[value.latitude, value.longitude]}
          icon={userIcon}
          draggable
          ref={(instance) => {
            markerRef.current = instance;
          }}
          eventHandlers={{
            dragend() {
              const marker = markerRef.current;
              if (!marker) return;
              const position = marker.getLatLng();
              onChange({ latitude: position.lat, longitude: position.lng });
            },
          }}
        >
          <Popup>Your Location<br />Drag to adjust</Popup>
        </Marker>

        {workers
          .map((worker) => ({
            ...worker,
            lat: parseFloat(String(worker.latitude)),
            lng: parseFloat(String(worker.longitude)),
          }))
          .filter((worker) => !Number.isNaN(worker.lat) && !Number.isNaN(worker.lng))
          .map((worker, index) => (
            <Marker key={`${worker.lat}-${worker.lng}-${index}`} position={[worker.lat, worker.lng]} icon={workerIcon}>
              <Popup>
                <b>{worker.name || 'Worker'}</b>
                <br />
                {worker.role || 'Service Worker'}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}

