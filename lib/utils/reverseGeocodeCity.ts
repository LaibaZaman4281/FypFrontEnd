/**
 * Port of `assets/components/helpers/reverseGeocodeCity.js`.
 *
 * OpenStreetMap Nominatim, keyless — the same service the React Native app uses,
 * with the same 8s timeout and the same deliberate refusal to fall back to a
 * state/county: broadening a saved map point to its province would widen every
 * city filter built on top of it.
 */

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const REQUEST_TIMEOUT_MS = 8000;

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
}

/** The most specific city-like locality Nominatim provides, or ''. */
export function extractCityFromReverseGeocode(result: NominatimResponse | null | undefined): string {
  const address = result?.address ?? {};
  const locality = [address.city, address.town, address.village, address.municipality].find(
    (value) => typeof value === 'string' && value.trim(),
  );

  return locality ? locality.trim() : '';
}

/**
 * Resolve a saved map point to a city. Returns '' for invalid coordinates, a
 * failed request, or a place Nominatim cannot name at city level — callers then
 * apply their own fallback.
 */
export async function reverseGeocodeCity(latitude: unknown, longitude: unknown): Promise<string> {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return '';
  }

  const query = [
    'format=jsonv2',
    `lat=${encodeURIComponent(String(lat))}`,
    `lon=${encodeURIComponent(String(lng))}`,
    'zoom=10',
    'addressdetails=1',
    'accept-language=en',
  ].join('&');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${NOMINATIM_REVERSE_URL}?${query}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
      },
      signal: controller.signal,
    });

    if (!response.ok) return '';

    return extractCityFromReverseGeocode((await response.json()) as NominatimResponse);
  } catch {
    return '';
  } finally {
    clearTimeout(timeoutId);
  }
}
