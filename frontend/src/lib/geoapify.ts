/**
 * Geoapify Configuration
 *
 * API docs: https://apidocs.geoapify.com/
 *
 * Used for:
 * - Geocoding & reverse geocoding
 * - Routing & directions
 * - Place details & POI search
 * - Map tiles (as a fallback/alternative layer)
 */

export const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY;

if (!GEOAPIFY_KEY) {
  throw new Error('Missing VITE_GEOAPIFY_KEY. Check your .env.local file.');
}

const GEOAPIFY_BASE = 'https://api.geoapify.com';

/**
 * Build a Geoapify API URL with the key appended.
 *
 * @param path  - API path, e.g. "/v1/geocode/search"
 * @param params - Additional query parameters
 * @returns     - Full URL with `&apiKey=` appended
 *
 * @example
 * geoapifyUrl('/v1/geocode/search', { text: 'Taj Mahal, Agra' })
 * // → "https://api.geoapify.com/v1/geocode/search?text=Taj+Mahal%2C+Agra&apiKey=ee1d..."
 */
export function geoapifyUrl(
  path: string,
  params: Record<string, string> = {}
): string {
  const url = new URL(path, GEOAPIFY_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('apiKey', GEOAPIFY_KEY);
  return url.toString();
}

// ── Nearby Attractions ────────────────────────────────────────────

export interface NearbyPlace {
  name: string;
  category: string;
  distance: number; // metres from origin
  lat?: number;
  lng?: number;
}

const CATEGORY_MAP: Record<string, string> = {
  'heritage': 'heritage',
  'tourism.sights': 'sights',
  'catering.restaurant': 'restaurant',
  'catering.cafe': 'cafe',
  'catering': 'restaurant',
  'tourism': 'sights',
};

export async function fetchNearbyAttractions(
  lat: number,
  lng: number,
  radiusMetres = 5000,
  limit = 10,
): Promise<NearbyPlace[]> {
  const categories = 'heritage,tourism.sights,catering.restaurant';
  const filter = `circle:${lng},${lat},${radiusMetres}`;
  const url = geoapifyUrl('/v2/places', {
    categories,
    filter,
    limit: String(limit),
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geoapify request failed: ${response.status}`);
  }

  const data = await response.json();

  return (data.features ?? []).map((feature: any) => {
    const props = feature.properties ?? {};
    // Map Geoapify's dot-notation category list to our simplified labels
    const rawCategories: string[] = props.categories ?? [];
    let category = 'sights';
    for (const raw of rawCategories) {
      const match = Object.keys(CATEGORY_MAP).find((k) => raw.startsWith(k));
      if (match) { category = CATEGORY_MAP[match]; break; }
    }

    return {
      name: props.name ?? props.address_line1 ?? 'Unnamed Place',
      category,
      distance: Math.round(props.distance ?? 0),
      lat: feature.geometry?.coordinates?.[1],
      lng: feature.geometry?.coordinates?.[0],
    } as NearbyPlace;
  });
}
