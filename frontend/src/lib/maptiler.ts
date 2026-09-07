/**
 * MapTiler Configuration
 *
 * API docs: https://docs.maptiler.com/cloud/api/
 *
 * MapTiler requires the API key as a `?key=` query parameter on all
 * requests. Use the `maptilerUrl()` helper to build properly keyed URLs.
 */

export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

if (!MAPTILER_KEY) {
  throw new Error('Missing VITE_MAPTILER_KEY. Check your .env.local file.');
}

/** Supported MapTiler base URLs */
export const MAPTILER_BASE = 'https://api.maptiler.com' as const;
export const MAPTILER_EU_BASE = 'https://api.maptiler.eu' as const;

/**
 * Build a MapTiler API URL with the key appended.
 *
 * @param path  - API path, e.g. "/maps/streets-v2/style.json"
 * @param base  - Base URL (defaults to api.maptiler.com)
 * @returns     - Full URL with `?key=` appended
 *
 * @example
 * maptilerUrl('/maps/streets-v2/style.json')
 * // → "https://api.maptiler.com/maps/streets-v2/style.json?key=elFs51jQ..."
 *
 * maptilerUrl('/tiles/v3/tiles.json', MAPTILER_EU_BASE)
 * // → "https://api.maptiler.eu/tiles/v3/tiles.json?key=elFs51jQ..."
 */
export function maptilerUrl(
  path: string,
  base: string = MAPTILER_BASE
): string {
  const url = new URL(path, base);
  url.searchParams.set('key', MAPTILER_KEY);
  return url.toString();
}
