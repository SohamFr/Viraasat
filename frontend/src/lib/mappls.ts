/**
 * Mappls (MapmyIndia) Configuration
 *
 * SDK docs: https://about.mappls.com/api/
 *
 * The REST API key is used for:
 * - Map tile rendering via Mappls Web SDK
 * - Geocoding & reverse geocoding
 * - Route planning & navigation
 * - Place search & autosuggest
 */

export const MAPPLS_KEY = import.meta.env.VITE_MAPPLS_KEY;

if (!MAPPLS_KEY) {
  throw new Error('Missing VITE_MAPPLS_KEY. Check your .env.local file.');
}

/**
 * Mappls SDK initialization config.
 *
 * Pass this to the Mappls Web SDK `mappls.initialize()` call
 * when setting up the map component.
 *
 * @example
 * import { mapplsConfig } from '@/lib/mappls';
 * const mapObject = mappls.initialize(mapplsConfig.key);
 */
export const mapplsConfig = {
  key: MAPPLS_KEY,
} as const;

import polyline from '@mapbox/polyline';

export interface RouteResult {
  coordinates: [number, number][];
}

export async function getDirections(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResult> {
  const url = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_KEY}/route_adv/driving/${startLng},${startLat};${endLng},${endLat}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Mappls request failed with status: ${response.status}`);
  }

  const data = await response.json();
  if (data.routes && data.routes.length > 0 && data.routes[0].geometry) {
    const encodedPolyline = data.routes[0].geometry;
    // polyline.decode returns [lat, lng]; MapLibre GeoJSON coordinates require [lng, lat]
    const coordinates = polyline.decode(encodedPolyline).map(([lat, lng]) => [lng, lat] as [number, number]);
    return { coordinates };
  }
  
  throw new Error('No routes returned in Mappls response');
}
