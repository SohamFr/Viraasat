/**
 * Mapillary Configuration — Free Street View Alternative
 *
 * Docs: https://www.mapillary.com/developer/api-documentation
 * Viewer SDK: https://mapillary.github.io/mapillary-js/
 *
 * We use Mapillary instead of Google Street View because:
 * - Mapillary is free and open-source
 * - Google Street View requires a paid API key
 * - Mapillary has excellent coverage of Indian heritage sites
 *
 * The viewer requires the `mapillary-js` package:
 *   npm install mapillary-js
 */

export const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_TOKEN;

if (!MAPILLARY_TOKEN) {
  throw new Error(
    'Missing VITE_MAPILLARY_TOKEN. Check your .env.local file.'
  );
}

/**
 * Initialize the Mapillary Viewer for panoramic monument views.
 *
 * @param containerId - The DOM element ID where the viewer will render
 * @param imageId     - Optional Mapillary image ID to display initially
 * @returns           - The Mapillary Viewer instance
 *
 * @example
 * import { initMapillaryViewer } from '@/lib/mapillary';
 *
 * // In a React useEffect:
 * useEffect(() => {
 *   const viewer = initMapillaryViewer('street-view-container', '1234567890');
 *   return () => viewer.remove();
 * }, []);
 *
 * // In JSX:
 * <div id="street-view-container" style={{ width: '100%', height: '400px' }} />
 */
export async function initMapillaryViewer(
  containerId: string,
  imageId?: string
) {
  // Dynamic import so the heavy viewer SDK is only loaded when needed
  const { Viewer } = await import('mapillary-js');

  const viewer = new Viewer({
    accessToken: MAPILLARY_TOKEN,
    container: containerId,
    imageId,
  });

  // Resize the viewer when the window resizes
  const handleResize = () => viewer.resize();
  window.addEventListener('resize', handleResize);

  // Attach cleanup helper to the viewer instance
  const originalRemove = viewer.remove.bind(viewer);
  viewer.remove = () => {
    window.removeEventListener('resize', handleResize);
    originalRemove();
  };

  return viewer;
}
