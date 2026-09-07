import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import { getDirections } from '../lib/mappls';
import { ArrowLeft, X, MapPin } from 'lucide-react';
import { fetchMonuments, type Monument } from '../data/monuments';

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
  'Delhi': { center: [77.2090, 28.6139], zoom: 12 }
};

const EPOCHS = [
  { label: 'All Eras', query: 'All' },
  { label: 'Ancient (~300 BCE)', query: 'bce|ancient' },
  { label: 'Classical / Gupta', query: '5th|6th|7th|8th' },
  { label: 'Medieval / Mughal', query: '10th|11th|12th|13th|14th|15th|16th|17th|18th' },
  { label: 'Colonial / Modern', query: '19th|20th' }
];

const STATE_PRESETS: Record<string, [number, number]> = {
  'Rajasthan': [73.8, 26.6],
  'Uttar Pradesh': [80.5, 27.0],
  'Karnataka': [76.0, 14.5],
  'Maharashtra': [76.0, 19.0],
  'Tamil Nadu': [78.5, 11.0],
  'Delhi': [77.2, 28.6],
  'Gujarat': [71.5, 22.5],
  'West Bengal': [88.0, 23.5],
  'Bihar': [85.5, 25.5],
  'Madhya Pradesh': [78.5, 23.0],
  'Odisha': [84.5, 20.5]
};

export function HeritageMap({ onBack, targetMonumentName, viewMode = 'explore' }: HeritageMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{monument: Monument, marker: maplibregl.Marker, el: HTMLElement}[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [activeStreetViewId, setActiveStreetViewId] = useState<string | null>(null);
  
  // Drawer States
  const [activeMonument, setActiveMonument] = useState<Monument | null>(null);
  
  const [monuments, setMonuments] = useState<Monument[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [timelineEpoch, setTimelineEpoch] = useState<string>('All');

  useEffect(() => {
    if (!activeStreetViewId) return;
    const token = import.meta.env.VITE_MAPILLARY_TOKEN;
    if (!token) { console.error('Mapillary token missing'); return; }
    const viewer = new Viewer({ accessToken: token, container: 'mly-container', imageId: activeStreetViewId });
    return () => viewer.remove();
  }, [activeStreetViewId]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAPTILER_STYLE,
      center: [78.9629, 20.5937],
      zoom: 4,
      pitch: 0,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'bottom-right');

    map.on('error', (e) => {
      if (e.error && (e.error.status === 403 || e.error.status === 401 || e.error.message?.includes('style') || e.error.message?.includes('fetch') || e.error.message?.includes('cors'))) {
        console.warn('MapTiler key blocked or failed. Switching to Carto Dark Matter style...');
        map.setStyle(CARTO_DARK_STYLE);
      }
    });

    const loadDataAndMarkers = async () => {
      try {
        const data = await fetchMonuments();
        setMonuments(data);
        
        // Clean up old markers
        markersRef.current.forEach(m => m.marker.remove());
        markersRef.current = [];

        let targetFound = false;

        data.forEach(monument => {
          const el = document.createElement('div');
          el.className = 'monument-marker';
          el.style.cssText = 'display:flex; flex-direction:column; align-items:center; cursor:pointer; position:relative; z-index:1;';

          const pill = document.createElement('div');
          pill.style.cssText = 'padding:4px 8px; background:rgba(20,20,20,0.9); border:2px solid #D97706; border-radius:6px; box-shadow: 2px 2px 0px 0px #D97706; pointer-events:auto; user-select:none; transition: box-shadow 0.2s, background-color 0.2s;';
          pill.innerHTML = `<span style="font-size:11px; font-weight:700; color:#F5F5F4; text-transform:uppercase; letter-spacing:0.05em; font-family:system-ui,sans-serif; white-space:nowrap;">${monument.name}</span>`;
          pill.addEventListener('mouseenter', () => { pill.style.transform = 'translate(-1px,-1px)'; pill.style.boxShadow = '3px 3px 0px 0px #D97706'; });
          pill.addEventListener('mouseleave', () => { pill.style.transform = 'translate(0px,0px)'; pill.style.boxShadow = '2px 2px 0px 0px #D97706'; });

          const tail = document.createElement('div');
          tail.style.cssText = 'width:6px; height:6px; transform:rotate(45deg); background:#141414; border-right:2px solid #D97706; border-bottom:2px solid #D97706; margin-top:-4px; pointer-events:none;';

          el.appendChild(pill);
          el.appendChild(tail);

          const currentZoom = map.getZoom();
          el.style.display = currentZoom >= 9 ? 'flex' : 'none';

          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([monument.lng, monument.lat])
            .addTo(map);

          markersRef.current.push({ monument, marker, el });

          pill.addEventListener('click', (e) => {
            e.stopPropagation();
            map.flyTo({ center: [monument.lng, monument.lat], zoom: 15.5, pitch: 60, bearing: -15, duration: 2500, essential: true });
            setActiveMonument(monument);
          });

          if (targetMonumentName && monument.name.toLowerCase().includes(targetMonumentName.toLowerCase())) {
            targetFound = true;
            setTimeout(() => pill.click(), 800);
          }
        });

        // Add City Markers
        Object.entries(CITY_PRESETS).forEach(([city, preset]) => {
          if (city === 'All') return;
          const cityEl = document.createElement('div');
          cityEl.className = 'city-marker';
          cityEl.style.cssText = 'display:flex; flex-direction:column; align-items:center; cursor:pointer; position:relative; z-index:2;';
          cityEl.innerHTML = `<div style="font-weight:bold; color:#FBF9F4; font-family: 'system-ui', sans-serif; font-size:11px; background-color:#1C1917; padding:2px 6px; border:2px solid #FBF9F4; border-radius: 6px;">${city}</div>`;
          
          cityEl.addEventListener('mouseenter', () => { cityEl.firstElementChild!.setAttribute('style', "font-weight:bold; color:#FBF9F4; font-family: 'system-ui', sans-serif; font-size:11px; background-color:#1C1917; padding:2px 6px; border:2px solid #FBF9F4; border-radius: 6px; transform: scale(1.05);"); });
          cityEl.addEventListener('mouseleave', () => { cityEl.firstElementChild!.setAttribute('style', "font-weight:bold; color:#FBF9F4; font-family: 'system-ui', sans-serif; font-size:11px; background-color:#1C1917; padding:2px 6px; border:2px solid #FBF9F4; border-radius: 6px; transform: scale(1);"); });

          cityEl.addEventListener('click', (e) => {
            e.stopPropagation();
            map.flyTo({ center: preset.center, zoom: 12, duration: 2000, essential: true });
          });

          const cityMarker = new maplibregl.Marker({ element: cityEl, anchor: 'center' })
            .setLngLat(preset.center as [number, number])
            .addTo(map);
          
          const currentZoom = map.getZoom();
          cityEl.style.display = currentZoom < 9 ? 'flex' : 'none';
          
          markersRef.current.push({ monument: { id: 'CITY_'+city, name: city } as any, marker: cityMarker, el: cityEl });
        });

        if (!targetFound && data.length > 0) {
          const bounds = new maplibregl.LngLatBounds();
          data.forEach(m => bounds.extend([m.lng, m.lat]));
          map.fitBounds(bounds, { padding: 50, duration: 1000 });
        }

        // Trigger initial zoom update
        map.fire('zoom');

      } catch (err: any) {
        console.error('Failed to load monuments:', err);
        setError('Failed to load map data.');
      }
    };

    map.on('load', () => {
      map.resize();
      loadDataAndMarkers();
    });

    let lastZoomState = -1; // -1: uninitialized, 0: < 9, 1: >= 9
    map.on('zoom', () => {
      const currentZoom = map.getZoom();
      const newZoomState = currentZoom >= 9 ? 1 : 0;
      
      if (newZoomState !== lastZoomState) {
        lastZoomState = newZoomState;
        markersRef.current.forEach(({ monument, el }) => {
          if (monument.id.toString().startsWith('CITY_')) {
            el.style.display = currentZoom < 9 ? 'flex' : 'none';
          } else {
            el.style.display = newZoomState === 1 ? 'flex' : 'none';
          }
        });
      }
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(mapContainer.current!);

    setTimeout(() => map.resize(), 300);

    return () => {
      resizeObserver.disconnect();
      map.remove();
    };
  }, [targetMonumentName]);

  const filterMap = (filter: string) => {
    setActiveFilter(filter);
    if (!mapRef.current) return;
    mapRef.current.resize();

    // 1. Cinematic camera fly-to if a city preset exists
    if (CITY_PRESETS[filter]) {
      const preset = CITY_PRESETS[filter];
      mapRef.current.flyTo({ center: preset.center, zoom: preset.zoom, pitch: 45, duration: 2000, essential: true });
    } else if (filter === 'All' && monuments.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      monuments.forEach(m => bounds.extend([m.lng, m.lat]));
      mapRef.current.fitBounds(bounds, { padding: 50, duration: 1500, pitch: 0, bearing: 0 });
    }

    // 2. Visually filter markers
    markersRef.current.forEach(({ monument, el }) => {
      const isMatch = filter === 'All' || monument.name.toLowerCase().includes(filter.toLowerCase()) || monument.description.toLowerCase().includes(filter.toLowerCase());
      el.style.opacity = isMatch ? '1' : '0.15';
      el.style.pointerEvents = isMatch ? 'auto' : 'none';
    });
  };

  const filterTimeline = (query: string) => {
    setTimelineEpoch(query);
    markersRef.current.forEach(({ monument, el }) => {
      if (query === 'All') {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        return;
      }
      
      const cent = monument.built_century.toLowerCase();
      const queries = query.split('|');
      const isMatch = queries.some(q => cent.includes(q));
      
      el.style.opacity = isMatch ? '1' : '0.15';
      el.style.pointerEvents = isMatch ? 'auto' : 'none';
    });
  };

  const handleShowRoute = async (endLat: number, endLng: number) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const startLat = pos.coords.latitude;
        const startLng = pos.coords.longitude;
        const routeResult = await getDirections(startLat, startLng, endLat, endLng);
        
        const map = mapRef.current;
        if (!map) return;

        if (routeResult.coordinates.length > 0) {
          const sourceId = 'route-source';
          const layerId = 'route-layer';
          if (map.getLayer(layerId)) map.removeLayer(layerId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
          map.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: routeResult.coordinates } }
          });
          map.addLayer({
            id: layerId, type: 'line', source: sourceId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#00f2fe', 'line-width': 6, 'line-opacity': 0.8, 'line-blur': 1 }
          });
          const bounds = new maplibregl.LngLatBounds()
            .extend([startLng, startLat])
            .extend([endLng, endLat]);
          map.fitBounds(bounds, { padding: 80, essential: true });
          
          setActiveMonument(null); // Close drawer to see the route
        }
      } catch (err) {
        console.error('Routing failed:', err);
        alert('Could not calculate route. Ensure you are on the whitelisted network.');
      }
    });
  };

  return (
    <div className="flex-1 w-full relative z-10 rounded-3xl overflow-hidden shadow-2xl mt-4 border border-white/10 bg-black/50 backdrop-blur-sm animate-fade-in flex flex-col">
      <div ref={mapContainer} className="w-full h-full min-h-[550px] relative rounded-2xl overflow-hidden" />

      {/* Top Controls Overlay (Explore Mode Filters) */}
      <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-start pointer-events-none">
        <button
          onClick={onBack}
          className="neo-btn px-5 py-2.5 bg-white text-stone-900 flex items-center gap-2 font-bold uppercase tracking-wider hover:bg-stone-200 transition-colors pointer-events-auto"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          <span>Return</span>
        </button>

        {viewMode === 'explore' && (
          <div className="hidden md:flex flex-wrap items-center justify-end gap-2 max-w-xl pointer-events-auto">
            {FILTER_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => filterMap(chip)}
                className={
                  'px-4 py-1.5 font-bold uppercase tracking-widest transition-all duration-300 ' +
                  (activeFilter === chip
                    ? 'bg-amber-400 text-stone-900 border-2 border-stone-900 shadow-[2px_2px_0px_#1c1917]'
                    : 'bg-stone-800 text-stone-300 border-2 border-stone-900 hover:bg-stone-700 hover:text-white')
                }
                style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px' }}
              >
                {chip === 'All' ? <MapPin size={12} className="inline mr-1.5 mb-0.5" /> : null}
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Heritage Timeline Overlay (Heritage Mode) */}
      {viewMode === 'heritage' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[55] bg-stone-900 p-2 flex gap-1 sm:gap-2 border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] pointer-events-auto overflow-x-auto max-w-[90vw] custom-scrollbar">
          {EPOCHS.map(epoch => (
            <button
              key={epoch.label}
              onClick={() => filterTimeline(epoch.query)}
              className={`px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border-2 border-stone-900 ${
                timelineEpoch === epoch.query ? 'bg-amber-400 text-stone-900 shadow-[2px_2px_0px_#1C1917]' : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white'
              }`}
            >
              {epoch.label}
            </button>
          ))}
        </div>
      )}

      {/* Cinematic Inspector Drawer */}
      {activeMonument && (
        <MonumentInspectorDrawer
          monument={activeMonument}
          onClose={() => setActiveMonument(null)}
          onShowRoute={handleShowRoute}
          onOpenStreetView={(id) => setActiveStreetViewId(id)}
        />
      )}

      {/* 360 View Overlay */}
      {activeStreetViewId && (
        <div className="fixed inset-0 z-[70] bg-black">
          <div id="mly-container" className="w-full h-full" />
          <button
            onClick={() => setActiveStreetViewId(null)}
            className="absolute top-6 right-6 neo-btn bg-white text-black p-3 hover:bg-stone-200 transition"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md">
          {error}
        </div>
      )}
    </div>
  );
}
