/**
 * Port of the place-search half of `assets/components/Map/Map.js`.
 *
 * Photon (OSM-based, keyless) provides worldwide place lookup. The React Native
 * screen debounced by 350 ms, kept the result count low for fair use of the
 * public demo endpoint, and cancelled in-flight requests by version. All three
 * behaviours are preserved here.
 */

const PHOTON_URL = 'https://photon.komoot.io/api/';
const REQUEST_TIMEOUT_MS = 8000;
const RESULT_LIMIT = 6;

export interface PlaceResult {
  id: string;
  title: string;
  subtitle: string;
  label: string;
  latitude: number;
  longitude: number;
}

interface PhotonFeature {
  id?: string | number;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    housenumber?: string | number;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    type?: string;
  };
}

/** Flatten a Photon feature into a title/subtitle pair, dropping repeats. */
export function formatPhotonPlace(feature: PhotonFeature, index = 0): PlaceResult | null {
  const coordinates = feature?.geometry?.coordinates;
  const longitude = Number(coordinates?.[0]);
  const latitude = Number(coordinates?.[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const properties = feature?.properties ?? {};
  const street = [properties.housenumber, properties.street].filter(Boolean).join(' ');
  const candidates = [
    properties.name,
    street,
    properties.district,
    properties.city,
    properties.state,
    properties.country,
  ];

  const parts: string[] = [];
  const seen = new Set<string>();
  candidates.forEach((value) => {
    const label = typeof value === 'string' ? value.trim() : '';
    const normalized = label.toLowerCase();
    if (label && !seen.has(normalized)) {
      parts.push(label);
      seen.add(normalized);
    }
  });

  const title = parts[0] || properties.type || 'Place';
  const subtitle = parts.slice(1).join(', ');

  return {
    id: String(feature.id ?? `${latitude.toFixed(6)}-${longitude.toFixed(6)}-${index}`),
    title,
    subtitle,
    label: [title, subtitle].filter(Boolean).join(', '),
    latitude,
    longitude,
  };
}

/**
 * Search for places by free text. Bias results towards `near` when known so a
 * query like "Gulshan" resolves inside the visitor's own city first.
 */
export async function searchPlaces(
  query: string,
  near?: { latitude: number; longitude: number } | null,
): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({ q: trimmed, limit: String(RESULT_LIMIT), lang: 'en' });
  if (near && Number.isFinite(near.latitude) && Number.isFinite(near.longitude)) {
    params.set('lat', String(near.latitude));
    params.set('lon', String(near.longitude));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PHOTON_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as { features?: PhotonFeature[] };
    const features = Array.isArray(payload?.features) ? payload.features : [];

    return features
      .map((feature, index) => formatPhotonPlace(feature, index))
      .filter((place): place is PlaceResult => place !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
