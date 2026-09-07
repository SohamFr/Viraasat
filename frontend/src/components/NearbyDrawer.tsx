import { useEffect, useState } from 'react';
import { X, Landmark, Utensils, Eye, Loader2 } from 'lucide-react';
import { fetchNearbyAttractions, type NearbyPlace } from '../lib/geoapify';

interface NearbyDrawerProps {
  isOpen: boolean;
  monumentCoords: { lat: number; lng: number } | null;
  onClose: () => void;
}

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'restaurant':
    case 'cafe':
      return <Utensils size={16} className="text-amber-400 flex-shrink-0" />;
    case 'heritage':
      return <Landmark size={16} className="text-blue-400 flex-shrink-0" />;
    default:
      return <Eye size={16} className="text-emerald-400 flex-shrink-0" />;
  }
}

function SkeletonItem() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-2 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}

export function NearbyDrawer({ isOpen, monumentCoords, onClose }: NearbyDrawerProps) {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !monumentCoords) return;

    setLoading(true);
    setError(null);
    setPlaces([]);

    fetchNearbyAttractions(monumentCoords.lat, monumentCoords.lng)
      .then(setPlaces)
      .catch((err) => {
        console.error('Geoapify fetch failed:', err);
        setError('Could not load nearby attractions.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, monumentCoords]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm z-[56] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="liquid-glass h-full flex flex-col border-l border-white/15 shadow-2xl backdrop-blur-2xl bg-black/60">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-8 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl text-white font-semibold" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Explore Nearby
              </h2>
              <p className="text-xs text-white/50 mt-0.5" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Heritage sites, views & dining within 5 km
              </p>
            </div>
            <button
              onClick={onClose}
              className="liquid-glass rounded-full w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 transition flex-shrink-0"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {loading && (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonItem key={i} />
                ))}
              </>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-400/20 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            {!loading && !error && places.length === 0 && (
              <div className="text-center text-white/40 text-sm py-12">
                <Landmark size={32} className="mx-auto mb-3 opacity-30" />
                No nearby places found.
              </div>
            )}

            {places.map((place, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-default"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CategoryIcon category={place.category} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-snug truncate">{place.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-white/40 text-xs capitalize">{place.category}</span>
                    {place.distance > 0 && (
                      <>
                        <span className="text-white/20 text-xs">·</span>
                        <span className="text-white/40 text-xs">
                          {place.distance < 1000
                            ? `${place.distance} m`
                            : `${(place.distance / 1000).toFixed(1)} km`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {!loading && places.length > 0 && (
            <div className="px-4 pb-6 pt-2 border-t border-white/10">
              <p className="text-xs text-white/30 text-center" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Powered by Geoapify · {places.length} results
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
