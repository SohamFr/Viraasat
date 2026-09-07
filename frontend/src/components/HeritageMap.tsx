import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import { getDirections } from '../lib/mappls';
import { ArrowLeft, X, MapPin } from 'lucide-react';
import { fetchMonuments, type Monument } from '../data/monuments';
import { MonumentInspectorDrawer } from './MonumentInspectorDrawer';

interface HeritageMapProps {
  onBack: () => void;
  targetMonumentName?: string | null;
  viewMode?: 'home' | 'explore' | 'heritage';
}

const MAPTILER_STYLE = `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${import.meta.env.VITE_MAPTILER_KEY || 'elFs51jQIbpwyTfcdjS8'}`;
const CARTO_DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const FILTER_CHIPS = ['All', 'Jaipur', 'Agra', 'Delhi', 'Hampi', 'Varanasi', 'Konark', 'Mumbai'];

const CITY_PRESETS: Record<string, { center: [number, number]; zoom: number }> = {
  'All': { center: [78.9629, 22.5937], zoom: 4.8 },
  'Jaipur': { center: [75.8267, 26.9239], zoom: 12.5 },
  'Agra': { center: [78.0421, 27.1751], zoom: 13 },
  'Hampi': { center: [76.4600, 15.3350], zoom: 12.8 },
  'Varanasi': { center: [83.0104, 25.3060], zoom: 13 },
  'Konark': { center: [86.0945, 19.8876], zoom: 13.5 },
  'Mumbai': { center: [72.8347, 18.9220], zoom: 12.5 },
  'Delhi': { center: [77.2090, 28.6139], zoom: 12 },
};

const EPOCHS = [
  { label: 'All Eras', query: 'All' },
  { label: 'Ancient (~300 BCE)', query: 'bce|ancient' },
  { label: 'Classical / Gupta', query: '5th|6th|7th|8th' },
  { label: 'Medieval / Mughal', query: '10th|11th|12th|13th|14th|15th|16th|17th|18th' },
  { label: 'Colonial / Modern', query: '19th|20th' },
];

const ZOOM_THRESHOLD = 8;

/** Create a monument pill marker element — NO CSS transitions on transform */
function createMonumentEl(name: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  // No transition on wrapper or any child — prevents marker drift
  wrapper.style.cssText =
    'display:flex;flex-direction:column;align-items:center;cursor:pointer;position:relative;';

  const pill = document.createElement('div');
  pill.style.cssText =
    'padding:4px 10px;background:#141414;border:2px solid #D97706;border-radius:6px;' +
    'box-shadow:2px 2px 0 #D97706;user-select:none;pointer-events:auto;';

  const label = document.createElement('span');
  label.style.cssText =
    'font-size:11px;font-weight:700;color:#F5F5F4;text-transform:uppercase;' +
    'letter-spacing:0.05em;font-family:system-ui,sans-serif;white-space:nowrap;';
  label.textContent = name;
  pill.appendChild(label);

  const dot = document.createElement('div');
  dot.style.cssText =
    'width:5px;height:5px;background:#D97706;border-radius:50%;margin-top:3px;';

  wrapper.appendChild(pill);
  wrapper.appendChild(dot);
  return wrapper;
}

/** Create a city label marker element */
function createCityEl(name: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText =
    'display:flex;align-items:center;cursor:pointer;position:relative;pointer-events:auto;';

  const label = document.createElement('div');
  label.style.cssText =
    'font-weight:700;color:#FBF9F4;font-family:system-ui,sans-serif;font-size:12px;' +
    'background:#1C1917;padding:3px 8px;border:2px solid #FBF9F4;border-radius:6px;' +
    'user-select:none;';
  label.textContent = name;

  el.appendChild(label);
  return el;
}

/** Update all marker visibility based on current zoom level */
function updateMarkerVisibility(
  markers: { isCityMarker: boolean; el: HTMLElement }[],
  zoom: number
) {
  const showMonuments = zoom >= ZOOM_THRESHOLD;
  markers.forEach(({ isCityMarker, el }) => {
    if (isCityMarker) {
      el.style.display = !showMonuments ? 'flex' : 'none';
    } else {
      el.style.display = showMonuments ? 'flex' : 'none';
    }
  });
}

export function HeritageMap({ onBack, targetMonumentName, viewMode = 'explore' }: HeritageMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  type MarkerEntry = { isCityMarker: boolean; monument?: Monument; cityName?: string; marker: maplibregl.Marker; el: HTMLElement };
  const markersRef = useRef<MarkerEntry[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [activeStreetViewId, setActiveStreetViewId] = useState<string | null>(null);
  const [activeMonument, setActiveMonument] = useState<Monument | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [timelineEpoch, setTimelineEpoch] = useState<string>('All');
  const [monuments, setMonuments] = useState<Monument[]>([]);

  // Street view
  useEffect(() => {
    if (!activeStreetViewId) return;
    const token = import.meta.env.VITE_MAPILLARY_TOKEN;
    if (!token) return;
    const viewer = new Viewer({ accessToken: token, container: 'mly-container', imageId: activeStreetViewId });
    return () => viewer.remove();
  }, [activeStreetViewId]);

  // Map init — runs once
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAPTILER_STYLE,
      center: [78.9629, 20.5937],
      zoom: 4,
      pitch: 0,
      // Disable map rotation on right-click drag (reduces accidental bearing changes)
      dragRotate: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false, showZoom: true }), 'bottom-right');

    map.on('error', (e) => {
      if (e.error?.status === 403 || e.error?.status === 401 ||
          e.error?.message?.includes('style') || e.error?.message?.includes('fetch')) {
        console.warn('MapTiler failed. Switching to Carto...');
        try { map.setStyle(CARTO_DARK_STYLE); } catch (_) {}
      }
    });

    const loadMarkers = async () => {
      try {
        const data = await fetchMonuments();
        setMonuments(data);

        // Remove any previous markers
        markersRef.current.forEach(({ marker }) => marker.remove());
        markersRef.current = [];

        const currentZoom = map.getZoom();
        const showMonuments = currentZoom >= ZOOM_THRESHOLD;
        let targetFound = false;

        // --- Monument markers ---
        data.forEach((monument) => {
          if (!monument.lat || !monument.lng || !isFinite(monument.lat) || !isFinite(monument.lng)) return;

          const el = createMonumentEl(monument.name);
          el.style.display = showMonuments ? 'flex' : 'none';

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            map.flyTo({ center: [monument.lng, monument.lat], zoom: 15, pitch: 45, bearing: 0, duration: 1800, essential: true });
            setActiveMonument(monument);
          });

          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([monument.lng, monument.lat])
            .addTo(map);

          markersRef.current.push({ isCityMarker: false, monument, marker, el });

          if (targetMonumentName && monument.name.toLowerCase().includes(targetMonumentName.toLowerCase())) {
            targetFound = true;
            // Fly then open drawer
            map.flyTo({ center: [monument.lng, monument.lat], zoom: 15, pitch: 45, bearing: 0, duration: 1800, essential: true });
            setTimeout(() => setActiveMonument(monument), 1000);
          }
        });

        // --- City markers ---
        Object.entries(CITY_PRESETS).forEach(([city, preset]) => {
          if (city === 'All') return;

          const cityEl = createCityEl(city);
          cityEl.style.display = !showMonuments ? 'flex' : 'none';

          cityEl.addEventListener('click', (e) => {
            e.stopPropagation();
            map.flyTo({
              center: preset.center,
              zoom: preset.zoom,
              pitch: 30,
              bearing: 0,
              duration: 2000,
              essential: true,
            });
            // After fly completes, markers will be shown by the zoom listener
          });

          const cityMarker = new maplibregl.Marker({ element: cityEl, anchor: 'center' })
            .setLngLat(preset.center)
            .addTo(map);

          markersRef.current.push({ isCityMarker: true, cityName: city, marker: cityMarker, el: cityEl });
        });

        // Fit to all monuments if no target
        if (!targetFound) {
          const valid = data.filter(m => m.lat && m.lng && isFinite(m.lat) && isFinite(m.lng));
          if (valid.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            valid.forEach(m => bounds.extend([m.lng, m.lat]));
            map.fitBounds(bounds, { padding: 80, maxZoom: 7, duration: 1200 });
          }
        }

      } catch (err) {
        console.error('Failed to load monuments:', err);
        setError('Failed to load map data.');
      }
    };

    map.on('load', () => {
      map.resize();
      loadMarkers();
    });

    // Zoom-based visibility — fires on every zoom tick
    map.on('zoom', () => {
      const zoom = map.getZoom();
      updateMarkerVisibility(markersRef.current, zoom);
    });

    // Also update after any flyTo/easeTo completes
    map.on('moveend', () => {
      const zoom = map.getZoom();
      updateMarkerVisibility(markersRef.current, zoom);
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainer.current!);
    setTimeout(() => map.resize(), 200);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map.remove();
    };
  }, []);

  // Handle targetMonumentName changes without rebuilding the map
  useEffect(() => {
    if (!targetMonumentName) return;
    const tryFly = (attempt = 0) => {
      const monumentMarkers = markersRef.current.filter(m => !m.isCityMarker && m.monument);
      if (monumentMarkers.length === 0) {
        if (attempt < 25) setTimeout(() => tryFly(attempt + 1), 300);
        return;
      }
      const match = monumentMarkers.find(({ monument }) =>
        monument!.name.toLowerCase().includes(targetMonumentName.toLowerCase())
      );
      if (match?.monument) {
        const map = mapRef.current;
        if (map) {
          map.flyTo({ center: [match.monument.lng, match.monument.lat], zoom: 15, pitch: 45, bearing: 0, duration: 1800, essential: true });
          setTimeout(() => setActiveMonument(match.monument!), 1000);
        }
      }
    };
    tryFly();
  }, [targetMonumentName]);

  const filterMap = (filter: string) => {
    setActiveFilter(filter);
    const map = mapRef.current;
    if (!map) return;

    if (CITY_PRESETS[filter]) {
      const preset = CITY_PRESETS[filter];
      map.flyTo({ center: preset.center, zoom: preset.zoom, pitch: 30, bearing: 0, duration: 1800, essential: true });
    } else if (filter === 'All') {
      const valid = monuments.filter(m => m.lat && m.lng && isFinite(m.lat) && isFinite(m.lng));
      if (valid.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        valid.forEach(m => bounds.extend([m.lng, m.lat]));
        map.fitBounds(bounds, { padding: 80, maxZoom: 7, duration: 1200 });
      }
    }

    // Highlight matching markers
    markersRef.current.forEach(({ isCityMarker, monument, el }) => {
      if (isCityMarker) return;
      const desc = monument?.description || '';
      const name = monument?.name || '';
      const isMatch = filter === 'All' || name.toLowerCase().includes(filter.toLowerCase()) || desc.toLowerCase().includes(filter.toLowerCase());
      el.style.opacity = isMatch ? '1' : '0.2';
      el.style.pointerEvents = isMatch ? 'auto' : 'none';
    });
  };

  const filterTimeline = (query: string) => {
    setTimelineEpoch(query);
    markersRef.current.forEach(({ isCityMarker, monument, el }) => {
      if (isCityMarker) return;
      if (query === 'All') {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        return;
      }
      const cent = (monument?.built_century || '').toLowerCase();
      const isMatch = query.split('|').some(q => cent.includes(q));
      el.style.opacity = isMatch ? '1' : '0.2';
      el.style.pointerEvents = isMatch ? 'auto' : 'none';
    });
  };

  const handleShowRoute = async (endLat: number, endLng: number) => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const routeResult = await getDirections(pos.coords.latitude, pos.coords.longitude, endLat, endLng);
        const map = mapRef.current;
        if (!map || routeResult.coordinates.length === 0) return;
        const srcId = 'route-source', layId = 'route-layer';
        if (map.getLayer(layId)) map.removeLayer(layId);
        if (map.getSource(srcId)) map.removeSource(srcId);
        map.addSource(srcId, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeResult.coordinates } } });
        map.addLayer({ id: layId, type: 'line', source: srcId, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#D97706', 'line-width': 5, 'line-opacity': 0.9 } });
        const bounds = new maplibregl.LngLatBounds().extend([pos.coords.longitude, pos.coords.latitude]).extend([endLng, endLat]);
        map.fitBounds(bounds, { padding: 80, essential: true });
        setActiveMonument(null);
      } catch (err) {
        console.error('Routing failed:', err);
        alert('Could not calculate route.');
      }
    });
  };

  return (
    <div className="flex-1 w-full relative z-10 rounded-3xl overflow-hidden shadow-2xl mt-4 border border-white/10 bg-black animate-fade-in flex flex-col">
      <div ref={mapContainer} className="w-full h-full min-h-[550px] relative" />

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-start pointer-events-none">
        <button
          onClick={onBack}
          className="neo-btn px-4 py-2 bg-white text-stone-900 flex items-center gap-2 font-bold uppercase tracking-wider text-sm hover:bg-stone-100 transition-colors pointer-events-auto"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Return</span>
        </button>

        {viewMode === 'explore' && (
          <div className="hidden md:flex flex-wrap items-center justify-end gap-1.5 max-w-xl pointer-events-auto">
            {FILTER_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => filterMap(chip)}
                className={
                  'px-3 py-1.5 font-bold uppercase tracking-widest text-[10px] border-2 border-stone-900 ' +
                  (activeFilter === chip
                    ? 'bg-amber-400 text-stone-900 shadow-[2px_2px_0px_#1c1917]'
                    : 'bg-stone-900/90 text-stone-300 hover:bg-stone-700 hover:text-white')
                }
                style={{ fontFamily: 'system-ui, sans-serif', borderRadius: '6px' }}
              >
                {chip === 'All' ? <MapPin size={10} className="inline mr-1 mb-0.5" /> : null}
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Heritage Timeline */}
      {viewMode === 'heritage' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[55] bg-stone-900 p-2 flex gap-1 sm:gap-2 border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] pointer-events-auto overflow-x-auto max-w-[90vw] custom-scrollbar" style={{ borderRadius: '8px' }}>
          {EPOCHS.map(epoch => (
            <button
              key={epoch.label}
              onClick={() => filterTimeline(epoch.query)}
              className={`px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap border-2 border-stone-900 ${
                timelineEpoch === epoch.query ? 'bg-amber-400 text-stone-900 shadow-[2px_2px_0px_#1C1917]' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white'
              }`}
              style={{ borderRadius: '6px' }}
            >
              {epoch.label}
            </button>
          ))}
        </div>
      )}

      {/* Monument Inspector Drawer */}
      {activeMonument && (
        <MonumentInspectorDrawer
          monument={activeMonument}
          onClose={() => setActiveMonument(null)}
          onShowRoute={handleShowRoute}
          onOpenStreetView={(id) => setActiveStreetViewId(id)}
        />
      )}

      {/* 360 Street View */}
      {activeStreetViewId && (
        <div className="fixed inset-0 z-[70] bg-black">
          <div id="mly-container" className="w-full h-full" />
          <button onClick={() => setActiveStreetViewId(null)} className="absolute top-6 right-6 neo-btn bg-white text-black p-3 hover:bg-stone-200">
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
          {error}
        </div>
      )}
    </div>
  );
}
