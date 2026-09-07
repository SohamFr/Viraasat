import React, { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { supabase } from '../lib/supabase';
import { MapPin, CheckCircle, Navigation } from 'lucide-react';

interface SavedMonument {
  id: string;
  monument_id: string;
  visited: boolean;
  monuments: {
    name: string;
    city: string;
    century: string;
    image_url: string;
  };
}

interface PassportViewProps {
  onBack: () => void;
  onPlotMap: (monumentName: string) => void;
}

export function PassportView({ onBack, onPlotMap }: PassportViewProps) {
  const [savedMonuments, setSavedMonuments] = useState<SavedMonument[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lenis smooth scroll
    const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const fetchSaves = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    // Using inner join
    const { data, error } = await supabase
      .from('saved_monuments')
      .select('id, monument_id, visited, monuments(name, city, century, image_url)')
      .eq('user_id', session.user.id)
      .order('saved_at', { ascending: false });
      
    if (!error && data) {
      setSavedMonuments(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSaves();
  }, []);

  useEffect(() => {
    if (!loading && savedMonuments.length > 0) {
      gsap.fromTo('.passport-card', 
        { opacity: 0, y: 50, rotation: -2 }, 
        { opacity: 1, y: 0, rotation: 0, stagger: 0.08, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [loading, savedMonuments]);

  const toggleVisited = async (id: string, currentStatus: boolean, index: number) => {
    const newStatus = !currentStatus;
    
    // Optimistic update
    setSavedMonuments(prev => prev.map(m => m.id === id ? { ...m, visited: newStatus } : m));
    
    if (newStatus) {
      // GSAP Slam animation for stamp
      gsap.fromTo(`.stamp-${id}`, 
        { scale: 3, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.3, ease: "back.inOut(2)" }
      );
    }

    await supabase
      .from('saved_monuments')
      .update({ visited: newStatus })
      .eq('id', id);
  };

  const totalSaved = savedMonuments.length;
  const totalVisited = savedMonuments.filter(m => m.visited).length;
  const progress = totalSaved === 0 ? 0 : Math.round((totalVisited / totalSaved) * 100);

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-[#FBF9F4] text-stone-900 font-sans"
    >
      {/* Header Banner - ASI Style */}
      <div className="w-full bg-[#1C1917] text-[#FBF9F4] p-6 sticky top-0 z-40 border-b-8 border-amber-500 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="neo-btn bg-white text-black px-4 py-2 text-sm font-bold uppercase hover:bg-amber-400">
              ← Return
            </button>
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-widest" style={{ fontFamily: "'Instrument Serif', serif" }}>
              My Heritage Passport
            </h1>
          </div>

          <div className="flex gap-8">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Sites Logged</span>
              <span className="text-3xl font-black">{totalSaved}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Explored</span>
              <span className="text-3xl font-black">{totalVisited}</span>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="max-w-6xl mx-auto mt-4 h-4 bg-stone-800 border-2 border-stone-600 relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-amber-500 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Brutalist segments */}
          {[25, 50, 75].map(tick => (
            <div key={tick} className="absolute top-0 h-full w-1 bg-stone-900" style={{ left: `${tick}%` }} />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto p-6 py-12">
        {loading ? (
          <div className="text-center font-bold text-2xl uppercase mt-20">Loading Dossiers...</div>
        ) : savedMonuments.length === 0 ? (
          <div className="text-center mt-20 max-w-md mx-auto paper-surface p-12">
            <h2 className="text-3xl mb-4 font-bold" style={{ fontFamily: "'Instrument Serif', serif" }}>No Permits Found</h2>
            <p className="font-medium text-stone-600 mb-6">You haven't added any heritage sites to your passport yet. Start exploring the map to build your collection.</p>
            <button onClick={onBack} className="neo-btn bg-amber-400 px-6 py-3 font-bold uppercase w-full">Explore Map</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedMonuments.map((save, index) => {
              const m = save.monuments;
              return (
                <div key={save.id} className="passport-card paper-surface flex flex-col relative group">
                  <div className="h-48 border-b-2 border-stone-900 overflow-hidden relative bg-stone-200">
                    {m.image_url ? (
                      <img src={m.image_url} alt={m.name} className="w-full h-full object-cover filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-stone-400 uppercase tracking-widest">No Image</div>
                    )}
                    
                    {save.visited && (
                      <div className={`stamp-${save.id} absolute inset-0 flex items-center justify-center pointer-events-none z-10`}>
                        <div className="stamp-visited text-4xl px-4 py-2 bg-white/90 backdrop-blur-sm shadow-xl">
                          EXPLORED
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-stone-900 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">{m.century || 'Unknown Era'}</span>
                      <span className="flex items-center gap-1 text-xs font-bold text-stone-600 uppercase"><MapPin size={12} /> {m.city}</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold leading-tight mb-4" style={{ fontFamily: "'Instrument Serif', serif" }}>{m.name}</h3>
                    
                    <div className="mt-auto pt-4 border-t-2 border-stone-200 flex gap-2">
                      <button 
                        onClick={() => toggleVisited(save.id, save.visited, index)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 font-bold text-sm uppercase transition-colors ${save.visited ? 'bg-stone-200 text-stone-900 border-2 border-stone-400' : 'neo-btn bg-white'}`}
                      >
                        <CheckCircle size={16} /> {save.visited ? 'Unmark' : 'Mark Visited'}
                      </button>
                      
                      <button 
                        onClick={() => onPlotMap(m.name)}
                        className="neo-btn bg-stone-900 text-white px-4 py-2 flex items-center justify-center"
                        title="Plot on Map"
                      >
                        <Navigation size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
