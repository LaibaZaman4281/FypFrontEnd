// 'use client';

// import { useEffect, useMemo, useRef, useState } from 'react';
// import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
// import L from 'leaflet';
// import 'leaflet/dist/leaflet.css';
// import { FALLBACK_CENTER, getCurrentPosition } from '@/lib/utils/geo';

// /**
//  * Web port of `assets/components/Map/Map.js`.
//  *
//  * The RN screen rendered Leaflet + OpenStreetMap tiles inside a WebView by
//  * building an HTML string. On the web we use the same Leaflet library directly,
//  * which also removes the HTML-injection issue the string building had.
//  *
//  * Behaviour kept identical:
//  *  - draggable blue marker for "my" position
//  *  - tapping/clicking the map moves the marker
//  *  - orange markers for nearby workers when a list is supplied
//  *  - GPS fix on mount, falling back to Rawalpindi so the flow is never a dead end
//  */

// export interface WorkerPin {
//   latitude: number | string;
//   longitude: number | string;
//   name?: string;
//   role?: string;
// }

// export interface Coords {
//   latitude: number;
//   longitude: number;
// }

// const userIcon = L.divIcon({
//   html: '<div style="background:#1E64D3;width:18px;height:18px;border-radius:50%;border:3px solid #FFF;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
//   iconSize: [18, 18],
//   iconAnchor: [9, 9],
//   className: '',
// });

// const workerIcon = L.divIcon({
//   html: '<div style="background:#FF6B35;width:16px;height:16px;border-radius:50%;border:2px solid #FFF;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
//   iconSize: [16, 16],
//   iconAnchor: [8, 8],
//   className: '',
// });

// function ClickCapture({ onPick }: { onPick: (coords: Coords) => void }) {
//   useMapEvents({
//     click(event) {
//       onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
//     },
//   });
//   return null;
// }

// export default function LocationPicker({
//   value,
//   onChange,
//   workers = [],
//   height = 420,
//   autoLocate = true,
// }: {
//   value: Coords | null;
//   onChange: (coords: Coords) => void;
//   workers?: WorkerPin[];
//   height?: number | string;
//   autoLocate?: boolean;
// }) {
//   const [ready, setReady] = useState(false);
//   const markerRef = useRef<L.Marker | null>(null);

//   useEffect(() => {
//     let cancelled = false;

//     (async () => {
//       if (value) {
//         setReady(true);
//         return;
//       }
//       if (autoLocate) {
//         const position = await getCurrentPosition();
//         if (cancelled) return;
//         if (position) {
//           onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude });
//         } else {
//           // No GPS fix or permission denied: show the map anyway so the user can
//           // drop the pin manually - mandatory location must never be a dead end.
//           onChange({ ...FALLBACK_CENTER });
//         }
//       } else {
//         onChange({ ...FALLBACK_CENTER });
//       }
//       setReady(true);
//     })();

//     return () => {
//       cancelled = true;
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const center = useMemo<[number, number]>(
//     () => [value?.latitude ?? FALLBACK_CENTER.latitude, value?.longitude ?? FALLBACK_CENTER.longitude],
//     // Only re-centre on first paint; dragging must not fight the user.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     [ready],
//   );

//   if (!ready || !value) {
//     return (
//       <div
//         className="flex items-center justify-center rounded-2xl border border-line bg-white text-sm font-medium text-subtle"
//         style={{ height }}
//       >
//         Detecting your location…
//       </div>
//     );
//   }

//   return (
//     <div className="overflow-hidden rounded-2xl border border-line" style={{ height }}>
//       <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full w-full">
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
//           maxZoom={19}
//         />

//         <ClickCapture onPick={onChange} />

//         <Marker
//           position={[value.latitude, value.longitude]}
//           icon={userIcon}
//           draggable
//           ref={(instance) => {
//             markerRef.current = instance;
//           }}
//           eventHandlers={{
//             dragend() {
//               const marker = markerRef.current;
//               if (!marker) return;
//               const position = marker.getLatLng();
//               onChange({ latitude: position.lat, longitude: position.lng });
//             },
//           }}
//         >
//           <Popup>Your Location<br />Drag to adjust</Popup>
//         </Marker>

//         {workers
//           .map((worker) => ({
//             ...worker,
//             lat: parseFloat(String(worker.latitude)),
//             lng: parseFloat(String(worker.longitude)),
//           }))
//           .filter((worker) => !Number.isNaN(worker.lat) && !Number.isNaN(worker.lng))
//           .map((worker, index) => (
//             <Marker key={`${worker.lat}-${worker.lng}-${index}`} position={[worker.lat, worker.lng]} icon={workerIcon}>
//               <Popup>
//                 <b>{worker.name || 'Worker'}</b>
//                 <br />
//                 {worker.role || 'Service Worker'}
//               </Popup>
//             </Marker>
//           ))}
//       </MapContainer>
//     </div>
//   );
// }
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
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
    <div className="overflow-hidden rounded-2xl border border-line" style={{ height }}>
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

